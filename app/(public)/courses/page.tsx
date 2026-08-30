import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import CourseFilters from "./CourseFilters";
import { categoryPillStyle, accentFor } from "@/lib/categoryColor";
import { Stars } from "@/components/StarRating";

export const metadata = { title: "Courses" };

const PAGE_SIZE = 12;

/** PostgREST `.or()` treats , ( ) as syntax — strip them out of user input. */
function sanitizeQuery(value: string) {
  return value.replace(/[,()*]/g, " ").trim().slice(0, 80);
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>;
}) {
  const { q = "", category = "", sort = "newest", page = "1" } = await searchParams;
  const supabase = await createClient();

  const currentPage = Math.max(1, Number(page) || 1);
  const search = sanitizeQuery(q);

  // Category pills come from the whole published catalog, not the filtered slice,
  // so the options don't vanish as you narrow down.
  const { data: allCategories } = await supabase
    .from("courses").select("category").eq("published", true).not("category", "is", null);
  const categories = Array.from(
    new Set((allCategories || []).map((row: any) => row.category).filter(Boolean))
  ).sort();

  let query = supabase
    .from("courses")
    .select(
      `id, slug, title, description, category, thumbnail_url, avg_rating, review_count,
       modules (id, lessons!lessons_module_id_fkey (id))`,
      { count: "exact" }
    )
    .eq("published", true);

  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  if (category) query = query.eq("category", category);

  if (sort === "title") query = query.order("title", { ascending: true });
  else if (sort === "rating") query = query.order("avg_rating", { ascending: false }).order("review_count", { ascending: false });
  else if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else query = query.order("created_at", { ascending: false });

  const from = (currentPage - 1) * PAGE_SIZE;
  const { data: courses, count } = await query.range(from, from + PAGE_SIZE - 1);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(search || category);

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/courses?${qs}` : "/courses";
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Course Catalog</h1>
        <p style={{ color: "var(--foreground-secondary)" }}>
          Browse all available courses. Request enrollment to get started.
        </p>
      </div>

      <Suspense fallback={<div className="mb-8 h-24" />}>
        <CourseFilters categories={categories as string[]} />
      </Suspense>

      {total > 0 && (
        <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
          {total} course{total !== 1 ? "s" : ""}
          {hasFilters ? " match your filters" : ""}
        </p>
      )}

      {courses && courses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => {
              const modules = (course.modules as any[]) || [];
              const lessonCount = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="card card-hover block overflow-hidden"
                >
                  <div
                    className="h-40 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, var(--accent-${accentFor(course.category)}-light) 0%, var(--card-secondary) 100%)` }}
                  >
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">📚</span>
                    )}
                  </div>
                  <div className="p-5">
                    {course.category && (
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={categoryPillStyle(course.category)}
                      >
                        {course.category}
                      </span>
                    )}
                    <h2 className="font-semibold mt-3 mb-2" style={{ color: "var(--foreground)" }}>
                      {course.title}
                    </h2>
                    <p className="text-sm line-clamp-2" style={{ color: "var(--foreground-secondary)" }}>
                      {course.description}
                    </p>
                    {(course.review_count ?? 0) > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs">
                        <Stars value={Number(course.avg_rating) || 0} size={13} />
                        <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                          {(Number(course.avg_rating) || 0).toFixed(1)}
                        </span>
                        <span style={{ color: "var(--foreground-muted)" }}>({course.review_count})</span>
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span style={{ color: "var(--foreground-muted)" }}>
                        {modules.length} module{modules.length !== 1 ? "s" : ""} · {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
                      </span>
                      <span className="font-semibold" style={{ color: "var(--primary)" }}>View →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {currentPage > 1 && (
                <Link
                  href={pageHref(currentPage - 1)}
                  className="text-sm font-semibold px-4 py-2 rounded-xl border"
                  style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground-secondary)" }}
                >
                  ← Previous
                </Link>
              )}
              <span className="text-sm px-3" style={{ color: "var(--foreground-muted)" }}>
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <Link
                  href={pageHref(currentPage + 1)}
                  className="text-sm font-semibold px-4 py-2 rounded-xl border"
                  style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground-secondary)" }}
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div
          className="text-center py-20 rounded-2xl border"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <span className="text-4xl mb-4 block">{hasFilters ? "🔍" : "📚"}</span>
          {hasFilters ? (
            <>
              <p className="mb-1" style={{ color: "var(--foreground-secondary)" }}>
                No courses match your search.
              </p>
              <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
                Try a different term or clear the filters.
              </p>
              <Link href="/courses" className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                Show all courses →
              </Link>
            </>
          ) : (
            <p style={{ color: "var(--foreground-secondary)" }}>
              Courses are being prepared. Check back soon.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
