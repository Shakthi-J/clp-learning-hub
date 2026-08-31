import { createAdminClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/auth";
import { NextResponse } from "next/server";

const ACCESS_TYPES = ["single_course", "all_access"];

/** Admin edits another person's profile: display name, sign-in email, access tier. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const actor = await getActor();
  if (actor?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { name, email, access_type } = await request.json();
  const admin = await createAdminClient();

  const { data: target } = await admin
    .from("patients").select("id, role, auth_user_id, email, name").eq("id", id).maybeSingle();
  if (!target) return NextResponse.json({ message: "User not found" }, { status: 404 });

  // Another admin's account is not editable from here, so one admin cannot lock
  // another out by changing their sign-in email.
  if (target.role === "admin" && target.id !== actor.id) {
    return NextResponse.json({ message: "Cannot edit another admin's account" }, { status: 403 });
  }

  const update: Record<string, unknown> = {};

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) return NextResponse.json({ message: "Name cannot be empty" }, { status: 400 });
    if (trimmed.length > 100) return NextResponse.json({ message: "Name must be under 100 characters" }, { status: 400 });

    // An instructor's name is the attribution on every course they wrote. Once
    // they have authored something, only they can change it - an admin renaming
    // them would silently re-credit their work to a different person.
    if (trimmed !== (target.name ?? "") && target.role === "instructor") {
      const { count } = await admin
        .from("courses").select("*", { count: "exact", head: true }).eq("created_by", id);
      if ((count ?? 0) > 0) {
        return NextResponse.json(
          {
            code: "AUTHORED_COURSES",
            message: `${target.name || "This instructor"} has authored ${count} course${count === 1 ? "" : "s"}. Their name is the credit on that work, so only they can change it, from their own profile.`,
          },
          { status: 403 }
        );
      }
    }

    update.name = trimmed;
  }

  if (access_type !== undefined) {
    if (!ACCESS_TYPES.includes(access_type)) {
      return NextResponse.json({ message: "Access type must be single_course or all_access" }, { status: 400 });
    }
    update.access_type = access_type;
  }

  // Email lives in auth as well as the profile row, and auth is the one that
  // decides whether they can sign in - so change it there first.
  const newEmail = email === undefined ? null : String(email).trim().toLowerCase();
  if (newEmail && newEmail !== (target.email ?? "").toLowerCase()) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
      return NextResponse.json({ message: "That email does not look valid" }, { status: 400 });
    }
    if (target.auth_user_id) {
      const { error: authError } = await admin.auth.admin.updateUserById(target.auth_user_id, {
        email: newEmail,
        email_confirm: true,
      });
      if (authError) {
        const already = authError.message.toLowerCase().includes("already");
        return NextResponse.json(
          { message: already ? "Another account already uses that email." : authError.message },
          { status: already ? 409 : 500 }
        );
      }
    }
    update.email = newEmail;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
  }

  const { error } = await admin.from("patients").update(update).eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
