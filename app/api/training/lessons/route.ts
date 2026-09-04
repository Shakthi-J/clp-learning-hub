import { createClient } from "@/lib/supabase/server";
import { getActor, isStaff } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { moduleId, title, drive_file_id, notes } = await request.json();
  if (!moduleId || !title?.trim()) {
    return NextResponse.json({ message: "moduleId and title are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("training_lessons").select("*", { count: "exact", head: true }).eq("module_id", moduleId);

  const { data, error } = await supabase
    .from("training_lessons")
    .insert({
      module_id: moduleId,
      title: title.trim(),
      drive_file_id: drive_file_id || null,
      notes: notes || null,
      order: (count ?? 0) + 1,
    })
    .select("id, title, order, drive_file_id, notes")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
