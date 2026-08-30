import { createClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/auth";
import { NextResponse } from "next/server";

const MAX_BODY = 2000;

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { courseId, rating, body } = await request.json();
  if (!courseId) return NextResponse.json({ message: "Missing courseId" }, { status: 400 });

  const score = Number(rating);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return NextResponse.json({ message: "Rating must be a whole number from 1 to 5" }, { status: 400 });
  }
  if (typeof body === "string" && body.length > MAX_BODY) {
    return NextResponse.json({ message: `Review must be under ${MAX_BODY} characters` }, { status: 400 });
  }

  const supabase = await createClient();

  // Only people who actually took the course may review it — this is the gate.
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("course_id", courseId)
    .eq("patient_id", actor.id)
    .in("status", ["active", "completed"])
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ message: "You can only review a course you are enrolled in" }, { status: 403 });
  }

  const { error } = await supabase.from("course_reviews").upsert(
    {
      course_id: courseId,
      patient_id: actor.id,
      rating: score,
      body: (body || "").trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "course_id,patient_id" }
  );

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ message: "Missing courseId" }, { status: 400 });

  const supabase = await createClient();
  let query = supabase.from("course_reviews").delete().eq("course_id", courseId);

  // Admins may remove any review; everyone else only their own.
  if (actor.role !== "admin") query = query.eq("patient_id", actor.id);
  else {
    const patientId = searchParams.get("patientId");
    if (patientId) query = query.eq("patient_id", patientId);
    else query = query.eq("patient_id", actor.id);
  }

  const { error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
