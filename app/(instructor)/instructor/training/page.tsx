import { getActor, isStaff } from "@/lib/auth";
import { redirect } from "next/navigation";
import TrainingPage from "@/app/(admin)/admin/training/page";

export const metadata = { title: "Staff Training" };

export default async function InstructorTrainingPage() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (!isStaff(actor)) redirect("/my-learning");

  return <TrainingPage />;
}
