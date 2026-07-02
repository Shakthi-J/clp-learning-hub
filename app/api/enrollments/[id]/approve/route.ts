import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data: admin } = await supabase.from("patients").select("id, role").eq("auth_user_id", user.id).single();
  if (admin?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { action } = await request.json();
  if (!["approve", "reject"].includes(action)) return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  const { data: req } = await supabase.from("enrollment_requests").select("id, patient_id, course_id, status").eq("id", id).single();
  if (!req) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (req.status !== "requested") return NextResponse.json({ message: "Already reviewed" }, { status: 409 });
  await supabase.from("enrollment_requests").update({ status: action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString(), reviewed_by: admin.id }).eq("id", id);
  if (action === "approve") await supabase.from("enrollments").insert({ patient_id: req.patient_id, course_id: req.course_id, status: "active" });
  return NextResponse.json({ success: true });
}
