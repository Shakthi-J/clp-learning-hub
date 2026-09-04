import { createClient } from "@/lib/supabase/server";
import { getActor, isStaff } from "@/lib/auth";
import { NextResponse } from "next/server";

const EDITABLE_FIELDS = ["title", "drive_file_id", "notes", "order"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const actor = await getActor();
  if (!actor || !isStaff(actor)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const update: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("training_lessons").update(update).eq("id", lessonId);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const actor = await getActor();
  if (!actor || !isStaff(actor)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const supabase = await createClient();
  const { error } = await supabase.from("training_lessons").delete().eq("id", lessonId);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
