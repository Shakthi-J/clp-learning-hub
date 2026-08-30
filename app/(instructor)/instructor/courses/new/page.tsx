import { getActor } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewCourse from "@/app/(admin)/admin/courses/new/page";

export const metadata = { title: "New Course" };

/**
 * Instructors create courses with the same form admins use. The API forces the
 * new course's owner and author to the creator, so an instructor cannot file a
 * course under someone else.
 */
export default async function InstructorNewCoursePage() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (actor.role !== "instructor" && actor.role !== "admin") redirect("/my-learning");

  return <NewCourse />;
}
