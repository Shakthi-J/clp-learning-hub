import { createClient } from "@/lib/supabase/server";
import { getActor, isStaff } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { title } = await request.json();
  if (!title?.trim()) return NextResponse.json({ message: "Title is required" }, { status: 400 });

  const supabase = await createClient();
  const { count } = await supabase.from("training_modules").select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("training_modules")
    .insert({ title: title.trim(), order: (count ?? 0) + 1 })
    .select("id, title, order")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
