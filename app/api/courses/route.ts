import { createClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin" && actor.role !== "instructor") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { title, slug, description, category, published, instructor_id } = await request.json();
  if (!title || !slug) {
    return NextResponse.json({ message: "Title and slug are required" }, { status: 400 });
  }

  // An instructor always owns and authors what they create - they cannot file a
  // course under someone else. An admin may assign an owner up front.
  const owner = actor.role === "admin" ? (instructor_id ?? null) : actor.id;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      title,
      slug,
      description,
      category,
      published: published ?? false,
      instructor_id: owner,
      created_by: actor.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "A course with this slug already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
