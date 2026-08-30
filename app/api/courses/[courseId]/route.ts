import { createClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/auth";
import { NextResponse } from "next/server";

// Only these columns may be set through the API — never spread the raw body
// into an update, or a caller could rewrite instructor_id, slug, or anything else.
const EDITABLE_FIELDS = ["title", "slug", "description", "category", "published", "thumbnail_url", "instructor_id"] as const;

function pickEditable(body: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }
  return update;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const actor = await getActor();
  if (actor?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const update = pickEditable(body);
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("courses").update(update).eq("id", courseId);
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "A course with this slug already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const actor = await getActor();
  if (actor?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
