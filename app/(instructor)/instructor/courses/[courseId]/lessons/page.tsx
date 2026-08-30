import { getActor, canManageCourse } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import LessonsEditor from "@/app/(admin)/admin/courses/[courseId]/lessons/page";

export const metadata = { title: "Lessons" };

export default async function InstructorLessonsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (!(await canManageCourse(actor, courseId))) notFound();

  return <LessonsEditor params={Promise.resolve({ courseId })} />;
}
