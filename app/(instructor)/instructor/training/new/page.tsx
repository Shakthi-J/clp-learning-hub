import { getActor, isStaff } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewTrainingLessonPage from "@/app/(admin)/admin/training/new/page";

export const metadata = { title: "New Training Lesson" };

export default async function InstructorNewTrainingLessonPage() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (!isStaff(actor)) redirect("/my-learning");

  return <NewTrainingLessonPage />;
}
