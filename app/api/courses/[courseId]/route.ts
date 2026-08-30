import { createClient } from "@/lib/supabase/server";
import { getActor, canManageCourse } from "@/lib/auth";
import { NextResponse } from "next/server";

// Only these columns may be set through the API - never spread the raw body
// into an update, or a caller could rewrite instructor_id, slug, or anything else.
const EDITABLE_FIELDS = ["title", "slug", "description", "category", "published", "thumbnail_url", "instructor_id"] as const;

// Reassigning a course is an admin action. If an instructor could set
// instructor_id they could hand their course to someone else, or take one.
const ADMIN_ONLY_FIELDS = new Set(["instructor_id"]);

function pickEditable(body: Record<string, unknown>, isAdmin: boolean) {
  const update: Record<string, unknown> = {};
  const rejected: string[] = [];
  for (const field of EDITABLE_FIELDS) {
    if (!(field in body)) continue;
    if (!isAdmin && ADMIN_ONLY_FIELDS.has(field)) {
      rejected.push(field);
      continue;
    }
    update[field] = body[field];
  }
  return { update, rejected };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;

  const actor = await getActor();
  if (!actor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Admins manage every course; instructors only those assigned to them.
  if (!(await canManageCourse(actor, courseId))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { update, rejected } = pickEditable(body, actor.role === "admin");

  if (rejected.length > 0) {
    return NextResponse.json(
      { message: `Only an admin can change: ${rejected.join(", ")}` },
      { status: 403 }
    );
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("courses").update(update).eq("id", courseId);
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "A course with this slug already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;

  // Deleting a course destroys its modules, lessons, enrollments and progress,
  // so it stays an admin action even for the assigned instructor.
  const actor = await getActor();
  if (actor?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
