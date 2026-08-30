import { createClient, createAdminClient } from "@/lib/supabase/server";
import { issueCertificate } from "@/lib/certificates";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { enrollmentId, lessonId } = await request.json();

  const { data: patient } = await supabase
    .from("patients").select("id").eq("auth_user_id", user.id).single();

  const { data: enrollment } = await supabase
    .from("enrollments").select("id, course_id")
    .eq("id", enrollmentId).eq("patient_id", patient?.id).single();

  if (!enrollment) return NextResponse.json({ message: "Enrollment not found" }, { status: 404 });

  // Mark lesson complete
  const { error } = await supabase.from("lesson_progress").upsert({
    enrollment_id: enrollmentId,
    lesson_id: lessonId,
    completed: true,
    completed_at: new Date().toISOString(),
  }, { onConflict: "enrollment_id,lesson_id" });

  if (error) return NextResponse.json({ message: "Failed to update progress" }, { status: 500 });

  // Check if all lessons in the course are now complete
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, modules!inner(course_id)")
    .eq("modules.course_id", enrollment.course_id);

  const { data: completedLessons } = await supabase
    .from("lesson_progress")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("completed", true);

  const totalLessons = allLessons?.length ?? 0;
  const totalCompleted = completedLessons?.length ?? 0;

  // If all lessons done, mark enrollment as completed and issue the certificate
  let certificateId: string | null = null;
  if (totalLessons > 0 && totalCompleted >= totalLessons) {
    await supabase.from("enrollments").update({
      status: "completed",
      completed_at: new Date().toISOString(),
    }).eq("id", enrollmentId);

    try {
      const admin = await createAdminClient();
      const cert = await issueCertificate(admin, enrollmentId);
      certificateId = cert?.id ?? null;
    } catch (err) {
      // Never fail progress tracking because certificate issuing hiccuped —
      // the patient can still mint it from /certificates.
      console.error("Certificate issue failed", err);
    }
  }

  return NextResponse.json({ success: true, totalLessons, totalCompleted, certificateId });
}