"use client";
import { useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import EnrollmentActions from "./EnrollmentActions";
import { categoryPillStyle } from "@/lib/categoryColor";

type Request = {
  id: string;
  requested_at: string;
  status: "requested" | "approved" | "rejected";
  patients: { name: string | null; email: string | null; access_type: string | null } | null;
  courses: { title: string | null; category: string | null } | null;
};

type Status = "requested" | "approved" | "rejected";

const EMPTY: Record<Status, { title: string; body: string }> = {
  requested: {
    title: "Nothing to review",
    body: "All caught up - every enrollment request has been reviewed.",
  },
  approved: {
    title: "No approved requests",
    body: "Approved requests will appear here once you accept one.",
  },
  rejected: {
    title: "No rejected requests",
    body: "Rejected requests will appear here.",
  },
};

export default function RequestList({ requests }: { requests: Request[] }) {
  const [status, setStatus] = useState<Status>("requested");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const counts = {
    requested: requests.filter((r) => r.status === "requested").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const FILTERS: { value: Status; label: string; count: number }[] = [
    { value: "requested", label: "Awaiting review", count: counts.requested },
    { value: "approved", label: "Approved", count: counts.approved },
    { value: "rejected", label: "Rejected", count: counts.rejected },
  ];

  const categories = Array.from(
    new Set(requests.map((r) => r.courses?.category).filter((c): c is string => !!c))
  ).sort();

  // Status and category narrow first so the pill counts and search matches
  // describe what's actually on screen.
  const term = search.trim().toLowerCase();
  const byStatus = requests.filter((r) => r.status === status);
  const byCategory = category === "all" ? byStatus : byStatus.filter((r) => r.courses?.category === category);
  const visible = term
    ? byCategory.filter((r) =>
        [r.patients?.name, r.patients?.email, r.courses?.title, r.courses?.category]
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
          placeholder="Search by learner or course"
          aria-label="Search requests"
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
        term ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--foreground-muted)" }}>
            Nothing matches &quot;{search.trim()}&quot; in {FILTERS.find((f) => f.value === status)!.label.toLowerCase()}.
          </p>
        ) : (
          <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>{EMPTY[status].title}</h3>
            <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>{EMPTY[status].body}</p>
          </div>
        )
      ) : (
        <div className="space-y-3 stagger">
          {visible.map((req) => (
            <div key={req.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                    >
                      {(req.patients?.name || req.patients?.email || "P")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                        {req.patients?.name || "Unknown"}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>
                        {req.patients?.email}
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-semibold px-2 py-1 rounded-full leading-none"
                      style={
                        req.patients?.access_type === "all_access"
                          ? { background: "var(--accent-indigo-light)", color: "var(--accent-indigo)" }
                          : req.patients?.access_type === "selected_courses"
                            ? { background: "var(--accent-blue-light)", color: "var(--accent-blue)" }
                            : { background: "var(--card-secondary)", color: "var(--foreground-secondary)" }
                      }
                    >
                      {req.patients?.access_type === "all_access"
                        ? "All Access"
                        : req.patients?.access_type === "selected_courses"
                          ? "Selected Courses"
                          : "Single Course"}
                    </span>
                  </div>

                  <div className="mt-2.5 ml-9">
                    <p className="text-sm flex items-center gap-2 flex-wrap" style={{ color: "var(--foreground-secondary)" }}>
                      Requested{" "}
                      <strong style={{ color: "var(--foreground)" }}>{req.courses?.title}</strong>
                      {req.courses?.category && (
                        <span
                          className="text-[11px] font-semibold px-2 py-1 rounded-full leading-none"
                          style={categoryPillStyle(req.courses.category)}
                        >
                          {req.courses.category}
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                      {new Date(req.requested_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {req.status === "requested" ? (
                  <EnrollmentActions id={req.id} />
                ) : (
                  <span
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
                    style={
                      req.status === "approved"
                        ? { background: "var(--success-light)", color: "var(--success)" }
                        : { background: "var(--danger-light)", color: "var(--danger)" }
                    }
                  >
                    {req.status === "approved" ? "Approved" : "Rejected"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
