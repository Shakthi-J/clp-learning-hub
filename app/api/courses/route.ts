import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data: admin } = await supabase.from("patients").select("role").eq("auth_user_id", user.id).single();
  if (admin?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { title, slug, description, category, published } = await request.json();
  if (!title || !slug) return NextResponse.json({ message: "Title and slug are required" }, { status: 400 });

  const { data, error } = await supabase
    .from("courses")
    .insert({ title, slug, description, category, published: published ?? false })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ message: "A course with this slug already exists." }, { status: 409 });
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
