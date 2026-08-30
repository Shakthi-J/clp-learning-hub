import { createClient, createAdminClient } from "@/lib/supabase/server";
import { issueCertificate } from "@/lib/certificates";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { enrollmentId } = await request.json();
  if (!enrollmentId) return NextResponse.json({ message: "Missing enrollmentId" }, { status: 400 });

  const { data: patient } = await supabase
    .from("patients").select("id").eq("auth_user_id", user.id).single();

  // Scoped to this patient's own enrollment — ownership is the gate, not the client.
  const { data: enrollment } = await supabase
    .from("enrollments").select("id, status")
    .eq("id", enrollmentId).eq("patient_id", patient?.id).single();

  if (!enrollment) return NextResponse.json({ message: "Enrollment not found" }, { status: 404 });
  if (enrollment.status !== "completed") {
    return NextResponse.json({ message: "Course not completed" }, { status: 400 });
  }

  try {
    const admin = await createAdminClient();
    const cert = await issueCertificate(admin, enrollmentId);
    return NextResponse.json({
      certificateId: cert.id,
      certificateNumber: cert.certificate_number,
    });
  } catch (err) {
    console.error("Certificate issue failed", err);
    return NextResponse.json({ message: "Could not issue certificate" }, { status: 500 });
  }
}
