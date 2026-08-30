import { createClient } from "@/lib/supabase/server";
import { getActor, canManageCourse } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const actor = await getActor();
  if (!actor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (actor.role !== "admin" && actor.role !== "instructor") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { status, feedback } = await request.json();
  if (!["approved", "needs_revision"].includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  const supabase = await createClient();

  // Instructors may only grade submissions belonging to their own courses.
  if (actor.role === "instructor") {
    const { data: submission } = await supabase
      .from("assignment_submissions")
      .select("id, assignments!inner (lessons!inner (modules!inner (course_id)))")
      .eq("id", id)
      .maybeSingle();

    const courseId = (submission as any)?.assignments?.lessons?.modules?.course_id;
    if (!courseId || !(await canManageCourse(actor, courseId))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabase.from("assignment_submissions").update({
    status,
    feedback: feedback || null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: actor.id,
  }).eq("id", id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
