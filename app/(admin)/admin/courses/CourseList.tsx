"use client";
import { useState } from "react";
import Link from "next/link";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import EditCategory from "./EditCategory";
import { categoryPillStyle } from "@/lib/categoryColor";

type Course = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  published: boolean;
  instructor_id: string | null;
  creator?: { name: string | null; email: string | null } | null;
  modules?: { id: string }[] | null;
};

type Instructor = { id: string; name: string | null; email: string | null };

type Status = "all" | "published" | "draft";

export default function CourseList({
  courses,
  instructors,
}: {
  courses: Course[];
  instructors: Instructor[];
}) {
  const [status, setStatus] = useState<Status>("all");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const published = courses.filter((c) => c.published).length;

  const FILTERS: { value: Status; label: string; count: number }[] = [
    { value: "all", label: "All", count: courses.length },
    { value: "published", label: "Published", count: published },
    { value: "draft", label: "Drafts", count: courses.length - published },
  ];

  // Whatever categories actually exist right now, so the filter and the
  // datalist offered when editing a category never drift from reality.
  const categories = Array.from(new Set(courses.map((c) => c.category).filter((c): c is string => !!c))).sort();

  // Status and category narrow first so the search term's matches (and the
  // pill counts) describe what's actually on screen, not the whole catalog.
  const term = search.trim().toLowerCase();
  const byStatus =
    status === "all" ? courses : courses.filter((c) => (status === "published" ? c.published : !c.published));
  const byCategory = category === "all" ? byStatus : byStatus.filter((c) => c.category === category);
  const visible = term
    ? byCategory.filter((c) =>
        [c.title, c.slug, c.category, c.creator?.name, c.creator?.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
      )
    : byCategory;

  return (
    <>
      <div className="relative mb-4 max-w-sm">
        <MagnifyingGlass
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--foreground-muted)" }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, category or author"
          aria-label="Search courses"
          className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm border"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5"
            style={{ color: "var(--foreground-muted)" }}
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        {FILTERS.map((f) => {
          const active = status === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              aria-pressed={active}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5"
              style={
                active
                  ? { background: "var(--primary)", borderColor: "var(--primary)", color: "var(--on-primary)" }
                  : { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground-secondary)" }
              }
            >
              {f.label}
              <span className="font-mono" style={{ opacity: 0.7 }}>{f.count}</span>
            </button>
          );
        })}
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <button
            onClick={() => setCategory("all")}
            aria-pressed={category === "all"}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
            style={
              category === "all"
                ? { background: "var(--foreground)", borderColor: "var(--foreground)", color: "var(--background)" }
                : { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground-muted)" }
            }
          >
            All categories
          </button>
          {categories.map((c) => {
            const active = category === c;
            const pill = categoryPillStyle(c);
            return (
              <button
                key={c}
                onClick={() => setCategory(active ? "all" : c)}
                aria-pressed={active}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                style={active ? { ...pill, borderColor: "transparent" } : { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground-muted)" }}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--foreground-muted)" }}>
          {term
            ? `No courses match "${search.trim()}"${status === "all" ? "" : status === "published" ? " among published" : " among drafts"}.`
            : status === "published"
              ? "Nothing is published yet."
              : "No drafts - everything is published."}
        </p>
      ) : (
        <div className="space-y-3 stagger">
          {visible.map((course) => {
            const modules = course.modules ?? [];
            return (
              <div key={course.id} className="card p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className="text-[11px] font-semibold px-2 py-1 rounded-full leading-none"
                      style={
                        course.published
                          ? { background: "var(--success-light)", color: "var(--success)" }
                          : { background: "var(--warning-light)", color: "var(--warning)" }
                      }
                    >
                      {course.published ? "Published" : "Draft"}
                    </span>
                    <EditCategory courseId={course.id} category={course.category} existingCategories={categories} />
                  </div>

                  <h3 className="font-semibold truncate tracking-tight" style={{ color: "var(--foreground)" }}>
                    {course.title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                    <span className="font-mono">{modules.length}</span> module{modules.length !== 1 ? "s" : ""} · /{course.slug}
                  </p>

                  {(() => {
                    // The course belongs to whoever made it - created_by when
                    // it's set, otherwise the assigned instructor (how every
                    // course made before that column was tracked is credited).
                    const author =
                      course.creator?.name || course.creator?.email ||
                      instructors.find((i) => i.id === course.instructor_id)?.name ||
                      instructors.find((i) => i.id === course.instructor_id)?.email;
                    return author ? (
                      <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>Written by {author}</p>
                    ) : null;
                  })()}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/courses/${course.id}/lessons`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
                  >
                    Lessons
                  </Link>
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
