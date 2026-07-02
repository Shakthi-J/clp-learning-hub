import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { assignmentId, enrollmentId, response } = await request.json();
  if (!response?.trim()) return NextResponse.json({ message: "Response is required" }, { status: 400 });

  const { data: patient } = await supabase.from("patients").select("id").eq("auth_user_id", user.id).single();

  // Check existing submission
  const { data: existing } = await supabase.from("assignment_submissions")
    .select("id").eq("patient_id", patient?.id).eq("assignment_id", assignmentId).maybeSingle();

  let submission;
  if (existing) {
    const { data } = await supabase.from("assignment_submissions")
      .update({ response, status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", existing.id).select("id, response, status, feedback, submitted_at").single();
    submission = data;
  } else {
    const { data } = await supabase.from("assignment_submissions")
      .insert({ patient_id: patient?.id, assignment_id: assignmentId, enrollment_id: enrollmentId, response })
      .select("id, response, status, feedback, submitted_at").single();
    submission = data;
  }

  return NextResponse.json({ success: true, submission });
}
