import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data: admin } = await supabase.from("patients").select("role").eq("auth_user_id", user.id).single();
  if (admin?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { moduleId, title, slug, youtube_video_id, notes } = await request.json();
  if (!moduleId || !title || !slug) return NextResponse.json({ message: "moduleId, title and slug are required" }, { status: 400 });

  const { count } = await supabase.from("lessons").select("*", { count: "exact", head: true }).eq("module_id", moduleId);

  const { data, error } = await supabase
    .from("lessons")
    .insert({ module_id: moduleId, title, slug, youtube_video_id, notes, order: (count ?? 0) + 1 })
    .select("id")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
