import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
export const metadata = { title: "My Learning" };
export default async function MyLearningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: patient } = await supabase.from("patients").select("id, name, access_type").eq("auth_user_id", user!.id).single();
  const { data: enrollments } = await supabase.from("enrollments")
    .select(`id, status, enrolled_at, courses (slug, title, category), lesson_progress (completed)`)
    .eq("patient_id", patient?.id).order("enrolled_at", { ascending: false });
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Welcome back{patient?.name ? `, ${patient.name.split(" ")[0]}` : ""}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>Continue where you left off</p>
      </div>
      {patient?.access_type && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{ background: patient.access_type === "all_access" ? "var(--primary-light)" : "var(--beige-light)", color: patient.access_type === "all_access" ? "var(--primary)" : "var(--foreground-secondary)" }}>
          {patient.access_type === "all_access" ? "All Access" : "Single Course"}
        </div>
      )}
      {enrollments && enrollments.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Your Courses</h2>
          {enrollments.map((enrollment) => {
            const course = enrollment.courses as any;
            const progress = enrollment.lesson_progress as any[];
            const completed = progress?.filter((p) => p.completed).length || 0;
            const total = progress?.length || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div key={enrollment.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    {course?.category && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{course.category}</span>}
                    <h3 className="font-semibold mt-2 mb-3" style={{ color: "var(--foreground)" }}>{course?.title}</h3>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--foreground-muted)" }}><span>{completed} of {total} lessons</span><span>{pct}%</span></div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--primary-light)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--primary)" }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={enrollment.status === "completed" ? { background: "#e8f5e9", color: "#2e7d32" } : { background: "var(--beige-light)", color: "var(--foreground-secondary)" }}>
                      {enrollment.status === "completed" ? "Completed" : "In Progress"}
                    </span>
                    {enrollment.status === "active" && course?.slug && (
                      <Link href={`/learn/${course.slug}`} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white primary-gradient">Continue</Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <span className="text-4xl block mb-3">📚</span>
          <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>No courses yet</h3>
          <p className="text-sm mb-6" style={{ color: "var(--foreground-secondary)" }}>Browse the catalog and request enrollment to get started.</p>
          <Link href="/courses" className="inline-block px-5 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient">Browse Courses</Link>
        </div>
      )}
    </div>
  );
}
