import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { enrollmentId, lessonId } = await request.json();
  const { data: patient } = await supabase.from("patients").select("id").eq("auth_user_id", user.id).single();
  const { data: enrollment } = await supabase.from("enrollments").select("id").eq("id", enrollmentId).eq("patient_id", patient?.id).single();
  if (!enrollment) return NextResponse.json({ message: "Enrollment not found" }, { status: 404 });
  const { error } = await supabase.from("lesson_progress").upsert({ enrollment_id: enrollmentId, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() }, { onConflict: "enrollment_id,lesson_id" });
  if (error) return NextResponse.json({ message: "Failed to update progress" }, { status: 500 });
  return NextResponse.json({ success: true });
}
