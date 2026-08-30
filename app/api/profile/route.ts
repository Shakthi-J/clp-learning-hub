import { createClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/auth";
import { NextResponse } from "next/server";

/** Updates the signed-in person's own display name. */
export async function PATCH(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  const trimmed = (name || "").trim();

  if (!trimmed) return NextResponse.json({ message: "Name cannot be empty" }, { status: 400 });
  if (trimmed.length > 100) {
    return NextResponse.json({ message: "Name must be under 100 characters" }, { status: 400 });
  }

  const supabase = await createClient();
  // Scoped to the actor's own row — role and access_type are deliberately not editable here.
  const { error } = await supabase.from("patients").update({ name: trimmed }).eq("id", actor.id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
