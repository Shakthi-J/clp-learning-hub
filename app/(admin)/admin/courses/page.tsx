import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Courses" };

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, category, published, created_at, modules(id)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Courses</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
            {courses?.length ?? 0} course{(courses?.length ?? 0) !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/admin/courses/new" className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient">
          + New Course
        </Link>
      </div>

      {courses && courses.length > 0 ? (
        <div className="space-y-3">
          {courses.map((course) => {
            const modules = course.modules as any[];
            return (
              <div key={course.id} className="card p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={course.published ? { background: "#e8f5e9", color: "#2e7d32" } : { background: "var(--beige-light)", color: "var(--foreground-muted)" }}>
                      {course.published ? "Published" : "Draft"}
                    </span>
                    {course.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                        {course.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{course.title}</h3>
                  <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                    {modules?.length ?? 0} module{(modules?.length ?? 0) !== 1 ? "s" : ""} · /{course.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/admin/courses/${course.id}/lessons`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}>
                    Lessons
                  </Link>
                  <Link href={`/admin/courses/${course.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <span className="text-4xl block mb-3">📚</span>
          <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>No courses yet</h3>
          <p className="text-sm mb-6" style={{ color: "var(--foreground-secondary)" }}>Create your first course to get started.</p>
          <Link href="/admin/courses/new" className="inline-block px-5 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient">
            Create First Course
          </Link>
        </div>
      )}
    </div>
  );
}
