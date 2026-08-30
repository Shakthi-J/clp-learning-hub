import { getActor, canManageCourse } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import CourseEditor from "@/app/(admin)/admin/courses/[courseId]/page";

export const metadata = { title: "Edit Course" };

/**
 * Instructors edit their own courses with the same screen admins use. The guard
 * matters: staff can READ any course under RLS, so without this an instructor
 * could open someone else's editor and see it, even though writes would fail.
 */
export default async function InstructorCourseEditorPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (!(await canManageCourse(actor, courseId))) notFound();

  return <CourseEditor params={Promise.resolve({ courseId })} />;
}
