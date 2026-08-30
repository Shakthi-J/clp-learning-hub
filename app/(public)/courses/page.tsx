import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { MagnifyingGlass, BookOpen, Stack, PlayCircle, ArrowRight } from "@phosphor-icons/react/ssr";
import CourseFilters from "./CourseFilters";
import { categoryPillStyle, accentFor } from "@/lib/categoryColor";
import { Stars } from "@/components/StarRating";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Courses" };

const PAGE_SIZE = 12;

/** PostgREST `.or()` treats , ( ) as syntax - strip them out of user input. */
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
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <PageHeader
        eyebrow="Catalog"
        title="Courses built by your care team"
        description="Every course here is written and reviewed by CLP clinicians. Request enrollment and your care team will approve it."
      />

      <Suspense fallback={<div className="mb-8 h-24" />}>
        <CourseFilters categories={categories as string[]} />
      </Suspense>

      {total > 0 && (
        <p className="text-sm mb-5" style={{ color: "var(--foreground-muted)" }}>
          <span className="font-mono font-medium" style={{ color: "var(--foreground-secondary)" }}>{total}</span>
          {" "}course{total !== 1 ? "s" : ""}{hasFilters ? " matching" : " available"}
        </p>
      )}

      {courses && courses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {courses.map((course: any) => {
              const modules = (course.modules as any[]) || [];
              const lessonCount = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
              const accent = accentFor(course.category);

              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="card card-hover group block overflow-hidden"
                >
                  <div
                    className="h-36 flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, var(--accent-${accent}-light) 0%, var(--card-secondary) 100%)` }}
                  >
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={28} weight="duotone" style={{ color: `var(--accent-${accent})`, opacity: 0.75 }} />
                    )}
                  </div>

                  <div className="p-5">
                    {course.category && (
                      <span
                        className="inline-flex text-[11px] font-semibold px-2 py-1 rounded-full leading-none"
                        style={categoryPillStyle(course.category)}
                      >
                        {course.category}
                      </span>
                    )}

                    <h2
                      className="font-semibold mt-3 mb-1.5 tracking-tight leading-snug"
                      style={{ color: "var(--foreground)" }}
                    >
                      {course.title}
                    </h2>
                    <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: "var(--foreground-secondary)" }}>
                      {course.description}
                    </p>

                    {(course.review_count ?? 0) > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs">
                        <Stars value={Number(course.avg_rating) || 0} size={13} />
                        <span className="font-mono font-medium" style={{ color: "var(--foreground)" }}>
                          {(Number(course.avg_rating) || 0).toFixed(1)}
                        </span>
                        <span style={{ color: "var(--foreground-muted)" }}>({course.review_count})</span>
                      </div>
                    )}

                    <div
                      className="mt-4 pt-4 flex items-center justify-between text-xs"
                      style={{ borderTop: "1px solid var(--border-light)" }}
                    >
                      <span className="inline-flex items-center gap-3" style={{ color: "var(--foreground-muted)" }}>
                        <span className="inline-flex items-center gap-1">
                          <Stack size={14} />
                          <span className="font-mono">{modules.length}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <PlayCircle size={14} />
                          <span className="font-mono">{lessonCount}</span>
                        </span>
                      </span>
                      <span
                        className="inline-flex items-center gap-1 font-semibold transition-transform duration-200 group-hover:translate-x-0.5"
                        style={{ color: "var(--primary)" }}
                      >
                        View <ArrowRight size={13} weight="bold" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
              {currentPage > 1 && (
                <ButtonLink href={pageHref(currentPage - 1)} variant="secondary" size="sm">
                  Previous
                </ButtonLink>
              )}
              <span className="text-xs px-3 font-mono" style={{ color: "var(--foreground-muted)" }}>
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages && (
                <ButtonLink href={pageHref(currentPage + 1)} variant="secondary" size="sm">
                  Next
                </ButtonLink>
              )}
            </nav>
          )}
        </>
      ) : hasFilters ? (
        <EmptyState
          icon={<MagnifyingGlass size={22} weight="duotone" />}
          title="Nothing matched that search"
          description="Try a broader term, or clear the filters to see the full catalog."
          action={<ButtonLink href="/courses" variant="secondary" size="sm">Show all courses</ButtonLink>}
          tone="var(--accent-blue)"
        />
      ) : (
        <EmptyState
          icon={<BookOpen size={22} weight="duotone" />}
          title="Courses are on the way"
          description="Your care team is preparing the first courses. They'll appear here as soon as they're published."
        />
      )}
    </div>
  );
}
