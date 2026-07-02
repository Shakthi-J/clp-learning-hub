import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { enrollmentId } = await request.json();
  const { data: patient } = await supabase.from("patients").select("id").eq("auth_user_id", user.id).single();
  const { data: enrollment } = await supabase.from("enrollments").select("id, status").eq("id", enrollmentId).eq("patient_id", patient?.id).single();
  if (!enrollment) return NextResponse.json({ message: "Enrollment not found" }, { status: 404 });
  if (enrollment.status !== "completed") return NextResponse.json({ message: "Course not completed" }, { status: 400 });
  const { data: existing } = await supabase.from("certificates").select("id").eq("enrollment_id", enrollmentId).single();
  if (existing) return NextResponse.json({ certificateId: existing.id });
  const { data: cert } = await supabase.from("certificates").insert({ enrollment_id: enrollmentId }).select("id").single();
  return NextResponse.json({ certificateId: cert?.id });
}
