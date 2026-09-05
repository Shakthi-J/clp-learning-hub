import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { courseId } = await request.json();
  if (!courseId) return NextResponse.json({ message: "courseId is required" }, { status: 400 });
  const { data: patient } = await supabase.from("patients").select("id, access_type, role").eq("auth_user_id", user.id).single();
  if (!patient) return NextResponse.json({ message: "Learner not found" }, { status: 404 });
  if (patient.role === "admin") return NextResponse.json({ message: "Admins cannot enroll" }, { status: 403 });

  // A course pass (single_course or selected_courses) enrols them directly -
  // nothing to request there. Anything outside the pass, on either tier,
  // still goes through the normal request-then-approve flow below.
  const { data: alreadyEnrolled } = await supabase
    .from("enrollments").select("id")
    .eq("patient_id", patient.id).eq("course_id", courseId)
    .in("status", ["active", "completed"])
    .maybeSingle();
  if (alreadyEnrolled) {
    return NextResponse.json({ message: "You already have access to this course." }, { status: 409 });
  }

  const { data: existing } = await supabase
    .from("enrollment_requests")
    .select("id")
    .eq("patient_id", patient.id)
    .eq("course_id", courseId)
    .in("status", ["requested"])
    .single();
  if (existing) return NextResponse.json({ message: "You already have a request for this course." }, { status: 409 });
  const { error } = await supabase.from("enrollment_requests").insert({ patient_id: patient.id, course_id: courseId, status: "requested" });
  if (error) return NextResponse.json({ message: "Failed to create request" }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
