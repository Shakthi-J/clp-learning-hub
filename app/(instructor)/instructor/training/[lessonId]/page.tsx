import { getActor, isStaff } from "@/lib/auth";
import { redirect } from "next/navigation";
import TrainingLessonPage from "@/app/(admin)/admin/training/[lessonId]/page";

export const metadata = { title: "Staff Training" };

export default async function InstructorTrainingLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (!isStaff(actor)) redirect("/my-learning");

  return <TrainingLessonPage params={params} basePathOverride="/instructor" />;
}
