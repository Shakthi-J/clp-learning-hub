import { createAdminClient } from "@/lib/supabase/server";
import { getActor, canManageCourse } from "@/lib/auth";
import { NextResponse } from "next/server";

/** Admins assign any course; instructors only the ones they own. */
async function authorize(courseId: string) {
  const actor = await getActor();
  if (!actor) return { ok: false as const, status: 401, message: "Unauthorized" };
  if (actor.role !== "admin" && actor.role !== "instructor") {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }
  if (!(await canManageCourse(actor, courseId))) {
    return { ok: false as const, status: 403, message: "You can only assign your own courses" };
  }
  return { ok: true as const, actor };
}

/**
 * Assigns a course to a learner. Assigning also enrols them, so the course
 * appears in My Learning straight away - staff assigning a course is the
 * decision, there is nothing left for the learner to request.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { courseId } = await request.json();
  if (!courseId) return NextResponse.json({ message: "courseId is required" }, { status: 400 });

  const auth = await authorize(courseId);
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const admin = await createAdminClient();

  const { data: learner } = await admin
    .from("patients").select("id, role").eq("id", id).maybeSingle();
  if (!learner) return NextResponse.json({ message: "Learner not found" }, { status: 404 });
  if (learner.role !== "patient") {
    return NextResponse.json({ message: "Courses can only be assigned to learners" }, { status: 400 });
  }

  const { error: grantError } = await admin
    .from("patient_course_access")
    .upsert(
      { patient_id: id, course_id: courseId, granted_by: auth.actor.id },
      { onConflict: "patient_id,course_id" }
    );
  if (grantError) return NextResponse.json({ message: grantError.message }, { status: 500 });

  // Enrol them unless they already have a row for this course, so re-assigning
  // never produces a duplicate or resets someone's progress.
  const { data: existing } = await admin
    .from("enrollments").select("id, status")
    .eq("patient_id", id).eq("course_id", courseId)
    .in("status", ["active", "completed"])
    .maybeSingle();

  if (!existing) {
    const { error: enrolError } = await admin
      .from("enrollments").insert({ patient_id: id, course_id: courseId, status: "active" });
    if (enrolError) return NextResponse.json({ message: enrolError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, enrolled: !existing });
}

/**
 * Removes an assignment. An enrolment with no learner work on it is deleted
 * outright; one that already holds progress is revoked instead - the row
 * (and every lesson_progress/certificate on it) stays for the record, but
 * 'revoked' is not 'active' or 'completed', so the lesson page and the
 * video/audio proxies stop the learner cold. Access removed has to mean
 * access removed, not "still active until they happen to finish."
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ message: "courseId is required" }, { status: 400 });

  const auth = await authorize(courseId);
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const admin = await createAdminClient();

  const { error } = await admin
    .from("patient_course_access").delete()
    .eq("patient_id", id).eq("course_id", courseId);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const { data: enrollment } = await admin
    .from("enrollments").select("id, status")
    .eq("patient_id", id).eq("course_id", courseId).eq("status", "active")
    .maybeSingle();

  let revokedEnrollment = false;
  if (enrollment) {
    const { count: progress } = await admin
      .from("lesson_progress").select("*", { count: "exact", head: true })
      .eq("enrollment_id", enrollment.id);
    const { count: certs } = await admin
      .from("certificates").select("*", { count: "exact", head: true })
      .eq("enrollment_id", enrollment.id);

    if ((progress ?? 0) === 0 && (certs ?? 0) === 0) {
      await admin.from("enrollments").delete().eq("id", enrollment.id);
    } else {
      await admin.from("enrollments").update({ status: "revoked" }).eq("id", enrollment.id);
      revokedEnrollment = true;
    }
  }

  return NextResponse.json({
    success: true,
    revokedEnrollment,
    message: revokedEnrollment
      ? "Access removed. They can no longer continue this course - their progress so far is kept on record, not deleted."
      : "Access removed.",
  });
}
