import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data: admin } = await supabase.from("patients").select("id, role").eq("auth_user_id", user.id).single();
  if (admin?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { status, feedback } = await request.json();
  if (!["approved", "needs_revision"].includes(status)) return NextResponse.json({ message: "Invalid status" }, { status: 400 });

  const { error } = await supabase.from("assignment_submissions").update({
    status, feedback: feedback || null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: admin.id,
  }).eq("id", id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
