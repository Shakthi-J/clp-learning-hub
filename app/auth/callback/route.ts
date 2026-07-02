import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { data: patient } = await supabase.from("patients").select("role").eq("auth_user_id", data.user.id).single();
      if (patient?.role === "admin") return NextResponse.redirect(`${origin}/admin`);
      return NextResponse.redirect(`${origin}/my-learning`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
