import { createAdminClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/auth";
import { NextResponse } from "next/server";

const ACCESS_TYPES = ["single_course", "selected_courses", "all_access"];

/** Admin edits another person's profile: display name, sign-in email, access tier. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const actor = await getActor();
  if (actor?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { name, email, access_type } = await request.json();
  const admin = await createAdminClient();

  const { data: target } = await admin
    .from("patients").select("id, role, auth_user_id, email, name, access_type").eq("id", id).maybeSingle();
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
      return NextResponse.json({ message: `Access type must be one of: ${ACCESS_TYPES.join(", ")}` }, { status: 400 });
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

  // Moving onto a tier that isn't all_access means access is now supposed to
  // be limited to specific granted courses - anything active they still hold
  // outside that list is access the new tier doesn't grant, so it stops here.
  // Completed courses (and their certificates) are never touched by this.
  let revokedCount = 0;
  if (
    target.role === "patient" &&
    access_type !== undefined &&
    access_type !== target.access_type &&
    access_type !== "all_access"
  ) {
    const { data: grants } = await admin
      .from("patient_course_access").select("course_id, granted_at").eq("patient_id", id)
      .order("granted_at", { ascending: false });

    // Single Course allows exactly one governed course. If more than one
    // survived from a previous tier, keep only the most recently granted and
    // drop the rest - their access stops along with everyone else's below.
    let governedIds = new Set((grants || []).map((g) => g.course_id));
    if (access_type === "single_course" && governedIds.size > 1) {
      const toDrop = (grants || []).slice(1).map((g) => g.course_id);
      await admin.from("patient_course_access").delete().eq("patient_id", id).in("course_id", toDrop);
      governedIds = new Set([grants![0].course_id]);
    }

    const { data: activeEnrollments } = await admin
      .from("enrollments").select("id, course_id").eq("patient_id", id).eq("status", "active");
    const toRevoke = (activeEnrollments || []).filter((e) => !governedIds.has(e.course_id));
    if (toRevoke.length > 0) {
      const { error: revokeError } = await admin
        .from("enrollments").update({ status: "revoked" }).in("id", toRevoke.map((e) => e.id));
      if (!revokeError) revokedCount = toRevoke.length;
    }
  }

  return NextResponse.json({
    success: true,
    revokedCount,
    message: revokedCount > 0
      ? `Saved. ${revokedCount} in-progress course${revokedCount === 1 ? "" : "s"} outside their new tier ${revokedCount === 1 ? "was" : "were"} stopped - progress is kept, not deleted.`
      : undefined,
  });
}

/**
 * Deletes a learner or instructor's account outright. patients.auth_user_id
 * cascades on delete (migration 000), which in turn cascades every row keyed
 * to that patient_id - enrollments, requests, progress, certificates,
 * comments, course access grants. A course they wrote or were assigned to
 * survives; instructor_id/created_by just go to null (migration 008), so
 * the course itself is never collateral damage.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const actor = await getActor();
  if (actor?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const admin = await createAdminClient();
  const { data: target } = await admin
    .from("patients").select("id, role, auth_user_id, name, email").eq("id", id).maybeSingle();
  if (!target) return NextResponse.json({ message: "User not found" }, { status: 404 });

  // Admin accounts are never deletable from this UI - the same boundary as
  // editing one, so no admin can be locked out or removed by another.
  if (target.role === "admin") {
    return NextResponse.json({ message: "Admin accounts cannot be deleted here." }, { status: 403 });
  }

  if (!target.auth_user_id) {
    // No sign-in to cascade from - remove the orphaned profile row directly.
    const { error } = await admin.from("patients").delete().eq("id", id);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const { error } = await admin.auth.admin.deleteUser(target.auth_user_id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
