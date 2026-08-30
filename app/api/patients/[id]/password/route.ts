import { createAdminClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/auth";
import { NextResponse } from "next/server";

const MIN_PASSWORD = 8;

/**
 * Admin sets a new sign-in password for someone, for the case where a learner
 * or instructor has lost access. The admin types the password themselves; it is
 * never generated or stored here beyond handing it to Supabase Auth.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const actor = await getActor();
  if (actor?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { password } = await request.json();
  if (!password || String(password).length < MIN_PASSWORD) {
    return NextResponse.json({ message: `Password must be at least ${MIN_PASSWORD} characters` }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { data: target } = await admin
    .from("patients").select("id, role, auth_user_id").eq("id", id).maybeSingle();

  if (!target) return NextResponse.json({ message: "User not found" }, { status: 404 });
  if (!target.auth_user_id) {
    return NextResponse.json({ message: "This account has no sign-in attached" }, { status: 400 });
  }
  // Resetting another admin's password would let one admin take over another's
  // account outright.
  if (target.role === "admin" && target.id !== actor.id) {
    return NextResponse.json({ message: "Cannot reset another admin's password" }, { status: 403 });
  }

  const { error } = await admin.auth.admin.updateUserById(target.auth_user_id, {
    password: String(password),
  });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
