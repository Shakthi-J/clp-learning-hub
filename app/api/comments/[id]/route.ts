import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getActor, canManageCourse } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Soft-deletes a comment. Authors can remove their own; admins can remove any;
 * instructors can moderate comments inside their own courses.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const actor = await getActor();
  if (!actor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data: comment } = await supabase
    .from("lesson_comments")
    .select("id, patient_id, lessons!inner (modules!inner (course_id))")
    .eq("id", id)
    .maybeSingle();

  if (!comment) return NextResponse.json({ message: "Comment not found" }, { status: 404 });

  const isAuthor = comment.patient_id === actor.id;
  const courseId = (comment as any)?.lessons?.modules?.course_id;
  const canModerate = actor.role === "admin" || (courseId ? await canManageCourse(actor, courseId) : false);

  if (!isAuthor && !canModerate) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // Moderators act on rows they don't own, so this write needs the service role.
  const client = isAuthor ? supabase : await createAdminClient();
  const { error } = await client
    .from("lesson_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
