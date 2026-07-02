import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import LessonPlayer from "./LessonPlayer";

export default async function LessonPage({ params }: { params: Promise<{ courseSlug: string; lessonSlug: string }> }) {
  const { courseSlug, lessonSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patient } = await supabase
    .from("patients").select("id, name").eq("auth_user_id", user.id).single();

  const { data: course } = await supabase
    .from("courses")
    .select(`id, title, slug, modules (id, title, order, lessons (id, title, slug, order, youtube_video_id, notes))`)
    .eq("slug", courseSlug).eq("published", true).single();

  if (!course) notFound();

  // Check enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("patient_id", patient?.id)
    .eq("course_id", course.id)
    .eq("status", "active")
    .single();

  if (!enrollment) redirect("/my-learning");

  // Get all lessons flat and sorted
  const modules = ((course.modules as any[]) || []).sort((a, b) => a.order - b.order);
  const allLessons: any[] = [];
  for (const mod of modules) {
    const sorted = (mod.lessons || []).sort((a: any, b: any) => a.order - b.order);
    for (const lesson of sorted) {
      allLessons.push({ ...lesson, moduleName: mod.title });
    }
  }

  const currentIndex = allLessons.findIndex(l => l.slug === lessonSlug);
  if (currentIndex === -1) notFound();

  const lesson = allLessons[currentIndex];
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Get progress
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed")
    .eq("enrollment_id", enrollment.id);

  const completedIds = new Set((progress || []).filter(p => p.completed).map(p => p.lesson_id));
  const isCompleted = completedIds.has(lesson.id);

  return (
    <div className="p-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "var(--foreground-muted)" }}>
        <Link href="/my-learning" style={{ color: "var(--foreground-secondary)" }}>My Learning</Link>
        <span>/</span>
        <Link href={`/learn/${courseSlug}`} style={{ color: "var(--foreground-secondary)" }}>{course.title}</Link>
        <span>/</span>
        <span style={{ color: "var(--foreground)" }}>{lesson.title}</span>
      </div>

      {/* Module label */}
      <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--primary)" }}>{lesson.moduleName}</p>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--foreground)" }}>{lesson.title}</h1>

      {/* Lesson player — client component handles video + mark complete */}
      <LessonPlayer
        lessonId={lesson.id}
        enrollmentId={enrollment.id}
        youtubeVideoId={lesson.youtube_video_id}
        notes={lesson.notes}
        isCompleted={isCompleted}
        prevLesson={prevLesson ? { slug: prevLesson.slug, title: prevLesson.title } : null}
        nextLesson={nextLesson ? { slug: nextLesson.slug, title: nextLesson.title } : null}
        courseSlug={courseSlug}
        totalLessons={allLessons.length}
        currentIndex={currentIndex}
      />
    </div>
  );
}
