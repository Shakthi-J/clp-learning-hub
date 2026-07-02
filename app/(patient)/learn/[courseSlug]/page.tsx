import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function LearnCoursePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patient } = await supabase
    .from("patients").select("id").eq("auth_user_id", user.id).single();

  const { data: course } = await supabase
    .from("courses")
    .select(`id, title, slug, modules (id, title, order, lessons (id, title, slug, order, youtube_video_id))`)
    .eq("slug", courseSlug).eq("published", true).single();

  if (!course) notFound();

  // Check patient is enrolled
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("patient_id", patient?.id)
    .eq("course_id", course.id)
    .eq("status", "active")
    .single();

  if (!enrollment) redirect("/my-learning");

  // Get lesson progress
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed")
    .eq("enrollment_id", enrollment.id);

  const completedIds = new Set((progress || []).filter(p => p.completed).map(p => p.lesson_id));

  const modules = ((course.modules as any[]) || []).sort((a, b) => a.order - b.order).map(m => ({
    ...m,
    lessons: (m.lessons || []).sort((a: any, b: any) => a.order - b.order),
  }));

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = completedIds.size;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Find first incomplete lesson for "Continue" button
  let firstIncomplete: any = null;
  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      if (!completedIds.has(lesson.id)) { firstIncomplete = lesson; break; }
    }
    if (firstIncomplete) break;
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <Link href="/my-learning" className="text-sm mb-6 inline-block" style={{ color: "var(--foreground-secondary)" }}>← My Learning</Link>
      <div className="card p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--foreground)" }}>{course.title}</h1>
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--foreground-muted)" }}>
            <span>{completedCount} of {totalLessons} lessons completed</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--primary-light)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--primary)" }} />
          </div>
        </div>
        {firstIncomplete && (
          <Link href={`/learn/${courseSlug}/${firstIncomplete.slug}`}
            className="inline-block mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient">
            {completedCount === 0 ? "Start Course →" : "Continue →"}
          </Link>
        )}
        {pct === 100 && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
            Course Complete! Well done.
          </div>
        )}
      </div>

      {/* Modules and lessons */}
      <div className="space-y-3">
        {modules.map((mod, mi) => (
          <div key={mod.id} className="card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--border)", background: "var(--card-secondary)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{mi + 1}</div>
              <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{mod.title}</span>
              <span className="ml-auto text-xs" style={{ color: "var(--foreground-muted)" }}>
                {mod.lessons.filter((l: any) => completedIds.has(l.id)).length}/{mod.lessons.length}
              </span>
            </div>
            {mod.lessons.map((lesson: any, li: number) => {
              const done = completedIds.has(lesson.id);
              return (
                <Link key={lesson.id} href={`/learn/${courseSlug}/${lesson.slug}`}
                  className="flex items-center gap-3 px-5 py-3 border-b last:border-b-0 hover:bg-opacity-50 transition-colors"
                  style={{ borderColor: "var(--border-light)", background: done ? "rgba(46,125,50,0.04)" : "transparent" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                    style={{ background: done ? "#e8f5e9" : "var(--beige-light)", color: done ? "#2e7d32" : "var(--foreground-muted)" }}>
                    {done ? "✓" : li + 1}
                  </div>
                  <span className="text-sm flex-1" style={{ color: done ? "var(--foreground-secondary)" : "var(--foreground)" }}>{lesson.title}</span>
                  {lesson.youtube_video_id && <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>▶</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
