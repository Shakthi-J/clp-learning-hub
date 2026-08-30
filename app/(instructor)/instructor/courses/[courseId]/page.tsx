import { getActor, canManageCourse } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Manage Course" };

export default async function InstructorCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const actor = await getActor();
  if (!actor) redirect("/login");

  // Ownership is the gate — an instructor cannot open a course they were not assigned.
  if (!(await canManageCourse(actor, courseId))) notFound();

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select(`id, slug, title, description, category, published,
             modules (id, title, order, lessons!lessons_module_id_fkey (id, title, order))`)
    .eq("id", courseId)
    .maybeSingle();

  if (!course) notFound();

  const modules = ((course.modules as any[]) || []).sort((a, b) => a.order - b.order);
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

  const { count: activeCount } = await supabase
    .from("enrollments").select("*", { count: "exact", head: true })
    .eq("course_id", courseId).eq("status", "active");

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/instructor/courses" className="text-sm mb-6 inline-block" style={{ color: "var(--foreground-secondary)" }}>
        ← My Courses
      </Link>

      <div className="card p-6 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            {course.category && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                {course.category}
              </span>
            )}
            <h1 className="text-2xl font-bold mt-3 mb-2" style={{ color: "var(--foreground)" }}>{course.title}</h1>
            <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>{course.description}</p>
            <p className="text-xs mt-3" style={{ color: "var(--foreground-muted)" }}>
              {modules.length} module{modules.length !== 1 ? "s" : ""} · {totalLessons} lesson{totalLessons !== 1 ? "s" : ""} · {activeCount ?? 0} active learner{(activeCount ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <span className={course.published ? "text-xs font-semibold px-2 py-1 rounded-full success-pill" : "text-xs font-semibold px-2 py-1 rounded-full warning-pill"}>
            {course.published ? "Published" : "Draft"}
          </span>
        </div>
      </div>

      <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Curriculum</h2>
      {modules.length > 0 ? (
        <div className="space-y-4">
          {modules.map((module) => {
            const lessons = (module.lessons || []).sort((a: any, b: any) => a.order - b.order);
            return (
              <div key={module.id} className="card p-5">
                <h3 className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>{module.title}</h3>
                {lessons.length > 0 ? (
                  <ul className="space-y-2">
                    {lessons.map((lesson: any, index: number) => (
                      <li key={lesson.id} className="flex items-center gap-3 text-sm" style={{ color: "var(--foreground-secondary)" }}>
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                          {index + 1}
                        </span>
                        <span className="min-w-0 truncate">{lesson.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>No lessons in this module yet.</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>No modules yet.</p>
        </div>
      )}

      <p className="text-xs mt-6" style={{ color: "var(--foreground-muted)" }}>
        Need to add or reorder lessons? Course structure is edited from the admin panel — ask a CLP admin.
      </p>
    </div>
  );
}
