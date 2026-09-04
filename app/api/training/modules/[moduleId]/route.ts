import { createClient } from "@/lib/supabase/server";
import { getActor, isStaff } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const actor = await getActor();
  if (!actor || !isStaff(actor)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { title } = await request.json();
  if (!title?.trim()) return NextResponse.json({ message: "Title is required" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("training_modules").update({ title: title.trim() }).eq("id", moduleId);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const actor = await getActor();
  if (!actor || !isStaff(actor)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const supabase = await createClient();
  const { error } = await supabase.from("training_modules").delete().eq("id", moduleId);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
