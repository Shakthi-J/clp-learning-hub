import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data: admin } = await supabase.from("patients").select("role").eq("auth_user_id", user.id).single();
  if (admin?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { name, email, password, access_type } = await request.json();
  if (!name || !email || !password) return NextResponse.json({ message: "Name, email and password are required" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
  const adminSupabase = await createAdminClient();
  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
  if (createError) {
    if (createError.message.includes("already registered")) return NextResponse.json({ message: "A patient with this email already exists." }, { status: 409 });
    return NextResponse.json({ message: createError.message }, { status: 500 });
  }
  await adminSupabase.from("patients").update({ name, access_type: access_type || "single_course", role: "patient" }).eq("auth_user_id", newUser.user.id);
  return NextResponse.json({ success: true, userId: newUser.user.id }, { status: 201 });
}
