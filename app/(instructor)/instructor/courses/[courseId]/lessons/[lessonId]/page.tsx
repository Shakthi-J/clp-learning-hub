import { getActor, canManageCourse, courseIdForLesson } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import LessonEditor from "@/app/(admin)/admin/courses/[courseId]/lessons/[lessonId]/page";

export const metadata = { title: "Edit Lesson" };

export default async function InstructorLessonEditorPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const actor = await getActor();
  if (!actor) redirect("/login");

  // Check the lesson's real owning course, not the id in the URL, so a crafted
  // path cannot pair someone else's lesson with a course this actor manages.
  const owningCourse = await courseIdForLesson(lessonId);
  if (!owningCourse || owningCourse !== courseId) notFound();
  if (!(await canManageCourse(actor, courseId))) notFound();

  return <LessonEditor params={Promise.resolve({ courseId, lessonId })} />;
}
