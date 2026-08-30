import { getActor, canManageCourse } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import NewLesson from "@/app/(admin)/admin/courses/[courseId]/lessons/new/page";

export const metadata = { title: "New Lesson" };

export default async function InstructorNewLessonPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (!(await canManageCourse(actor, courseId))) notFound();

  return <NewLesson params={Promise.resolve({ courseId })} />;
}
