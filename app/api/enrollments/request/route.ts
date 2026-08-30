import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { courseId } = await request.json();
  if (!courseId) return NextResponse.json({ message: "courseId is required" }, { status: 400 });
  const { data: patient } = await supabase.from("patients").select("id, access_type, role").eq("auth_user_id", user.id).single();
  if (!patient) return NextResponse.json({ message: "Patient not found" }, { status: 404 });
  if (patient.role === "admin") return NextResponse.json({ message: "Admins cannot enroll" }, { status: 403 });
  // Learners on the selected tier take the courses staff assigned them, so
  // there is nothing to request - a course they were not given is not theirs
  // to ask for.
  if (patient.access_type === "selected_courses") {
    const { data: granted } = await supabase
      .from("patient_course_access").select("course_id")
      .eq("patient_id", patient.id).eq("course_id", courseId).maybeSingle();
    if (!granted) {
      return NextResponse.json(
        { code: "NOT_ASSIGNED", message: "Your care team assigns your courses. Contact them if you need this one." },
        { status: 403 }
      );
    }
  }

  if (patient.access_type === "single_course") {
    const { data: active } = await supabase.from("enrollments").select("id").eq("patient_id", patient.id).eq("status", "active");
    if (active && active.length > 0) return NextResponse.json({ code: "ACTIVE_ENROLLMENT", message: "Complete your current course before requesting a new one." }, { status: 409 });
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
