import { createClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/auth";
import { NextResponse } from "next/server";

const MAX_BODY = 4000;

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { lessonId, body, parentId } = await request.json();
  if (!lessonId) return NextResponse.json({ message: "Missing lessonId" }, { status: 400 });

  const text = (body || "").trim();
  if (!text) return NextResponse.json({ message: "Comment cannot be empty" }, { status: 400 });
  if (text.length > MAX_BODY) {
    return NextResponse.json({ message: `Comment must be under ${MAX_BODY} characters` }, { status: 400 });
  }

  const supabase = await createClient();

  // Resolve the lesson's course, then require enrollment (or staff).
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, modules!lessons_module_id_fkey (course_id)")
    .eq("id", lessonId)
    .maybeSingle();

  const courseId = (lesson?.modules as any)?.course_id;
  if (!courseId) return NextResponse.json({ message: "Lesson not found" }, { status: 404 });

  if (actor.role === "patient") {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("patient_id", actor.id)
      .in("status", ["active", "completed"])
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ message: "You must be enrolled to post here" }, { status: 403 });
    }
  }

  // A reply must attach to a comment on the same lesson, and replies stay one level deep.
  if (parentId) {
    const { data: parent } = await supabase
      .from("lesson_comments")
      .select("id, lesson_id, parent_id")
      .eq("id", parentId)
      .maybeSingle();

    if (!parent || parent.lesson_id !== lessonId) {
      return NextResponse.json({ message: "Invalid parent comment" }, { status: 400 });
    }
    if (parent.parent_id) {
      return NextResponse.json({ message: "Replies cannot be nested further" }, { status: 400 });
    }
  }

  const { error } = await supabase.from("lesson_comments").insert({
    lesson_id: lessonId,
    patient_id: actor.id,
    parent_id: parentId || null,
    body: text,
  });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
