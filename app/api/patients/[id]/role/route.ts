import { createAdminClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/auth";
import { NextResponse } from "next/server";

const ASSIGNABLE_ROLES = ["patient", "instructor"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const actor = await getActor();
  if (actor?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { role } = await request.json();

  // Admin is deliberately not assignable through the UI — promoting an admin
  // stays a manual action in the Supabase dashboard.
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ message: "Role must be patient or instructor" }, { status: 400 });
  }

  const admin = await createAdminClient();

  const { data: target } = await admin
    .from("patients").select("id, role").eq("id", id).maybeSingle();
  if (!target) return NextResponse.json({ message: "User not found" }, { status: 404 });
  if (target.role === "admin") {
    return NextResponse.json({ message: "Cannot change an admin's role here" }, { status: 400 });
  }

  // Demoting an instructor would orphan their courses — block it while any are assigned.
  if (target.role === "instructor" && role === "patient") {
    const { count } = await admin
      .from("courses").select("*", { count: "exact", head: true }).eq("instructor_id", id);
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { message: `Reassign this instructor's ${count} course(s) before changing their role.` },
        { status: 409 }
      );
    }
  }

  const { error } = await admin.from("patients").update({ role }).eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
