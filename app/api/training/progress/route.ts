import { createClient } from "@/lib/supabase/server";
import { getActor, isStaff } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { lessonId, completed } = await request.json();
  if (!lessonId) return NextResponse.json({ message: "lessonId is required" }, { status: 400 });

  const supabase = await createClient();

  if (completed) {
    const { error } = await supabase
      .from("training_progress")
      .upsert({ lesson_id: lessonId, patient_id: actor.id }, { onConflict: "lesson_id,patient_id" });
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("training_progress")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("patient_id", actor.id);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
