import { createClient } from "@/lib/supabase/server";
import { getActor, isStaff } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PencilSimple } from "@phosphor-icons/react/ssr";
import TrainingPlayer from "@/components/TrainingPlayer";

export const metadata = { title: "Staff Training" };

export default async function TrainingLessonPage({
  params, basePathOverride,
}: {
  params: Promise<{ lessonId: string }>;
  basePathOverride?: "/admin" | "/instructor";
}) {
  const { lessonId } = await params;
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (!isStaff(actor)) redirect("/my-learning");

  const basePath = basePathOverride ?? "/admin";
  const supabase = await createClient();

  // Every lesson across every module, in the order it should be watched, so
  // Previous/Next can walk the whole training programme rather than staying
  // inside one module.
  const { data: modules } = await supabase
    .from("training_modules")
    .select("id, order, training_lessons(id, title, order, drive_file_id, notes)")
    .order("order");

  const allLessons = (modules || [])
    .flatMap((m: any) =>
      (m.training_lessons || [])
        .sort((a: any, b: any) => a.order - b.order)
        .map((l: any) => ({ ...l, moduleOrder: m.order }))
    );

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  if (currentIndex === -1) notFound();

  const lesson = allLessons[currentIndex];
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const { data: progress } = await supabase
    .from("training_progress")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("patient_id", actor.id)
    .maybeSingle();

  return (
    <div className="p-5 sm:p-8 max-w-4xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link
          href={`${basePath}/training`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: "var(--foreground-secondary)" }}
        >
          <ArrowLeft size={14} weight="bold" /> All training
        </Link>
        <Link
          href={`${basePath}/training/${lesson.id}/edit`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: "var(--primary)" }}
        >
          <PencilSimple size={14} weight="bold" /> Edit
        </Link>
      </div>

      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--foreground)" }}>{lesson.title}</h1>

      <TrainingPlayer
        lessonId={lesson.id}
        driveFileId={lesson.drive_file_id}
        notes={lesson.notes}
        isCompleted={!!progress}
        prevLesson={prevLesson ? { id: prevLesson.id, title: prevLesson.title } : null}
        nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null}
        basePath={basePath}
      />
    </div>
  );
}
