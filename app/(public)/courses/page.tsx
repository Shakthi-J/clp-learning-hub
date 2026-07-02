import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
export const metadata = { title: "Courses" };
export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase.from("courses").select("id, slug, title, description, category, thumbnail_url").eq("published", true).order("created_at", { ascending: false });
  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Course Catalog</h1>
        <p style={{ color: "var(--foreground-secondary)" }}>Browse all available courses. Request enrollment to get started.</p>
      </div>
      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.slug}`} className="card card-hover block overflow-hidden">
              <div className="h-40 clinical-gradient flex items-center justify-center">
                {course.thumbnail_url ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" /> : <span className="text-4xl">📚</span>}
              </div>
              <div className="p-5">
                {course.category && <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{course.category}</span>}
                <h2 className="font-semibold mt-3 mb-2" style={{ color: "var(--foreground)" }}>{course.title}</h2>
                <p className="text-sm line-clamp-2" style={{ color: "var(--foreground-secondary)" }}>{course.description}</p>
                <div className="mt-4 text-xs font-semibold" style={{ color: "var(--primary)" }}>View Course →</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <span className="text-4xl mb-4 block">📚</span>
          <p style={{ color: "var(--foreground-secondary)" }}>Courses are being prepared. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
