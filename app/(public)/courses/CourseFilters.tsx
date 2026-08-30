"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "rating", label: "Top rated" },
  { value: "title", label: "Title A–Z" },
];

export default function CourseFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeCategory = searchParams.get("category") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  // Keep the input in sync when the URL changes from outside (back button, reset link).
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const push = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // any filter change returns to page 1
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  // Debounce typing so we aren't pushing a route on every keystroke.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (query === current) return;
    const timer = setTimeout(() => push({ q: query }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasFilters = Boolean(query || activeCategory || activeSort !== "newest");

  return (
    <div className="mb-8 space-y-4" style={{ opacity: isPending ? 0.6 : 1 }}>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
            style={{ color: "var(--foreground-muted)" }}
          >
            🔍
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses…"
            aria-label="Search courses"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
        </div>

        <select
          value={activeSort}
          onChange={(e) => push({ sort: e.target.value === "newest" ? "" : e.target.value })}
          aria-label="Sort courses"
          className="px-3 py-2.5 rounded-xl text-sm border"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>{sort.label}</option>
          ))}
        </select>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => push({ category: "" })}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border"
            style={
              !activeCategory
                ? { background: "var(--primary)", borderColor: "var(--primary)", color: "#fff" }
                : { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground-secondary)" }
            }
          >
            All
          </button>
          {categories.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => push({ category: active ? "" : category })}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                style={
                  active
                    ? { background: "var(--primary)", borderColor: "var(--primary)", color: "#fff" }
                    : { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground-secondary)" }
                }
              >
                {category}
              </button>
            );
          })}
          {hasFilters && (
            <button
              onClick={() => { setQuery(""); push({ q: "", category: "", sort: "" }); }}
              className="text-xs font-medium px-2 py-1.5 underline"
              style={{ color: "var(--foreground-muted)" }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
