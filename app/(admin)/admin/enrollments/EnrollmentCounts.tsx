"use client";
import { useState } from "react";
import { categoryPillStyle } from "@/lib/categoryColor";

type Enrollment = {
  status: "active" | "completed";
  courses: { title: string | null; category: string | null } | null;
};

type Row = { key: string; label: string; count: number; category?: string | null };

/**
 * How many learners are actually enrolled right now, by course and by
 * category - built from the enrollments table itself, not the request
 * queue below. A course-pass grant enrols someone without ever creating a
 * request, so this is the only count that isn't quietly missing people.
 */
export default function EnrollmentCounts({ enrollments }: { enrollments: Enrollment[] }) {
  const [view, setView] = useState<"course" | "category">("course");

  const byCourse = new Map<string, number>();
  const byCategory = new Map<string, number>();
  for (const e of enrollments) {
    const title = e.courses?.title || "Untitled course";
    byCourse.set(title, (byCourse.get(title) ?? 0) + 1);
    const category = e.courses?.category;
    if (category) byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
  }

  const toRows = (m: Map<string, number>, withCategory: boolean): Row[] =>
    Array.from(m.entries())
      .map(([label, count]) => ({ key: label, label, count, category: withCategory ? label : undefined }))
      .sort((a, b) => b.count - a.count);

  const rows = view === "course" ? toRows(byCourse, false) : toRows(byCategory, true);
  const max = Math.max(1, ...rows.map((r) => r.count));
  const totalEnrolled = enrollments.length;

  return (
    <div className="card p-5 mb-8">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Enrolled learners</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
            {totalEnrolled} active or completed enrollment{totalEnrolled === 1 ? "" : "s"} - includes course passes, not just approved requests.
          </p>
        </div>
        <div className="flex gap-1.5 p-1 rounded-lg" style={{ background: "var(--card-secondary)" }}>
          {(["course", "category"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className="text-xs font-semibold px-3 py-1.5 rounded-md"
              style={
                view === v
                  ? { background: "var(--card)", color: "var(--foreground)", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }
                  : { color: "var(--foreground-muted)" }
              }
            >
              By {v === "course" ? "Course" : "Category"}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>No one is enrolled in anything yet.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-3">
              <div className="w-40 flex-shrink-0 truncate">
                {row.category ? (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full leading-none" style={categoryPillStyle(row.category)}>
                    {row.label}
                  </span>
                ) : (
                  <span className="text-sm" style={{ color: "var(--foreground)" }} title={row.label}>{row.label}</span>
                )}
              </div>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--card-secondary)" }}>
                <div className="h-full rounded-full" style={{ width: `${(row.count / max) * 100}%`, background: "var(--primary)" }} />
              </div>
              <span className="w-8 text-right text-sm font-mono font-semibold flex-shrink-0" style={{ color: "var(--foreground)" }}>
                {row.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
