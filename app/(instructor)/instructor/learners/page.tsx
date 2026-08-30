import { getActor } from "@/lib/auth";
import { getManagedCourseIds } from "@/lib/instructor";
import { createClient } from "@/lib/supabase/server";
import { categoryColor } from "@/lib/categoryColor";
import { redirect } from "next/navigation";

export const metadata = { title: "Learners" };

export default async function InstructorLearnersPage() {
  const actor = await getActor();
  if (!actor) redirect("/login");

  const supabase = await createClient();
  const courseIds = await getManagedCourseIds(actor);

  // Scoped to this instructor's courses only — never the whole patient list.
  const { data: enrollments } = courseIds.length
    ? await supabase
        .from("enrollments")
        .select(`id, status, enrolled_at, completed_at,
                 patients!enrollments_patient_id_fkey (name, email),
                 courses (title, category),
                 lesson_progress (completed)`)
        .in("course_id", courseIds)
        .order("enrolled_at", { ascending: false })
    : { data: [] as any[] };

  const rows = ((enrollments as any[]) || []).map((enrollment) => {
    const progress = (enrollment.lesson_progress as any[]) || [];
    const completed = progress.filter((p) => p.completed).length;
    const total = progress.length;
    return {
      id: enrollment.id,
      name: enrollment.patients?.name || "—",
      email: enrollment.patients?.email || "—",
      course: enrollment.courses?.title || "—",
      category: enrollment.courses?.category ?? null,
      status: enrollment.status,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total,
      enrolledAt: enrollment.enrolled_at,
    };
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Learners</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
          {rows.length} enrollment{rows.length !== 1 ? "s" : ""} across your courses
        </p>
      </div>

      {rows.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--card-secondary)" }}>
                {["Learner", "Course", "Progress", "Status", "Enrolled"].map((header) => (
                  <th key={header} className="text-left px-5 py-3 font-medium" style={{ color: "var(--foreground-secondary)" }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className="border-b" style={{ borderColor: "var(--border-light)", background: i % 2 === 0 ? "var(--card)" : "var(--background)" }}>
                  <td className="px-5 py-3">
                    <div className="font-medium" style={{ color: "var(--foreground)" }}>{row.name}</div>
                    <div className="text-xs" style={{ color: "var(--foreground-muted)" }}>{row.email}</div>
                  </td>
                  <td className="px-5 py-3" style={{ color: "var(--foreground-secondary)" }}>{row.course}</td>
                  <td className="px-5 py-3 w-48">
                    <div className="flex justify-between text-xs mb-1" style={{ color: "var(--foreground-muted)" }}>
                      <span>{row.completed}/{row.total}</span>
                      <span>{row.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-light)" }}>
                      <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: categoryColor(row.category) }} />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={row.status === "completed" ? "text-xs font-semibold px-2 py-1 rounded-full success-pill" : "text-xs font-semibold px-2 py-1 rounded-full warning-pill"}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {row.enrolledAt ? new Date(row.enrolledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <span className="text-4xl block mb-3">👥</span>
          <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>No learners yet</h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--foreground-secondary)" }}>
            Learners appear here once an admin approves an enrollment in one of your courses.
          </p>
        </div>
      )}
    </div>
  );
}
