import { getActor, isStaff } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditTrainingLessonPage from "@/app/(admin)/admin/training/[lessonId]/edit/page";

export const metadata = { title: "Edit Training Lesson" };

export default async function InstructorEditTrainingLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (!isStaff(actor)) redirect("/my-learning");

  return <EditTrainingLessonPage params={params} />;
}
