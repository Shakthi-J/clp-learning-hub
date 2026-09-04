import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { assignmentId, enrollmentId, response, file_path, file_name, file_size } = await request.json();
  if (!response?.trim()) return NextResponse.json({ message: "Response is required" }, { status: 400 });

  const { data: patient } = await supabase.from("patients").select("id").eq("auth_user_id", user.id).single();

  // The upload itself went straight from the browser to Storage under this
  // user's own path, so all that needs checking here is that a path claimed
  // as this submission's attachment actually starts with their auth id -
  // otherwise a crafted request could point a submission at someone else's file.
  const fileFields: Record<string, unknown> = {};
  if (file_path !== undefined) {
    if (file_path !== null && !String(file_path).startsWith(`${user.id}/`)) {
      return NextResponse.json({ message: "Invalid attachment" }, { status: 400 });
    }
    fileFields.file_path = file_path;
    fileFields.file_name = file_name ?? null;
    fileFields.file_size = file_size ?? null;
  }

  const { data: existing } = await supabase.from("assignment_submissions")
    .select("id").eq("patient_id", patient?.id).eq("assignment_id", assignmentId).maybeSingle();

  const columns = "id, response, status, feedback, submitted_at, file_path, file_name, file_size";

  let submission;
  if (existing) {
    const { data } = await supabase.from("assignment_submissions")
      .update({ response, status: "submitted", submitted_at: new Date().toISOString(), ...fileFields })
      .eq("id", existing.id).select(columns).single();
    submission = data;
  } else {
    const { data } = await supabase.from("assignment_submissions")
      .insert({ patient_id: patient?.id, assignment_id: assignmentId, enrollment_id: enrollmentId, response, ...fileFields })
      .select(columns).single();
    submission = data;
  }

  return NextResponse.json({ success: true, submission });
}
