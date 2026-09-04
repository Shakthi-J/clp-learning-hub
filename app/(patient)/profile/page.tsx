import { createClient } from "@/lib/supabase/server";
import { ArrowRight, BookOpen, CheckCircle, PlayCircle, Certificate } from "@phosphor-icons/react/ssr";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import { AppearanceCard, DisplayNameCard, PasswordCard } from "@/components/AccountSettings";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, email, access_type, created_at")
    .eq("auth_user_id", user.id)
    .single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, status, lesson_progress (completed)")
    .eq("patient_id", patient?.id);

  const rows = (enrollments as any[]) || [];
  const active = rows.filter((e) => e.status === "active").length;
  const completed = rows.filter((e) => e.status === "completed").length;
  const lessonsDone = rows.reduce(
    (acc, e) => acc + (((e.lesson_progress as any[]) || []).filter((p) => p.completed).length),
    0
  );

  const { count: certificateCount } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true })
    .in("enrollment_id", rows.map((e) => e.id).length ? rows.map((e) => e.id) : ["00000000-0000-0000-0000-000000000000"]);

  const allAccess = patient?.access_type === "all_access";
  const selected = patient?.access_type === "selected_courses";

  const stats = [
    { label: "Active courses", value: active, icon: <BookOpen size={18} weight="duotone" />, accent: "blue" as const },
    { label: "Completed", value: completed, icon: <CheckCircle size={18} weight="duotone" />, accent: "teal" as const },
    { label: "Lessons finished", value: lessonsDone, icon: <PlayCircle size={18} weight="duotone" />, accent: "purple" as const },
    { label: "Certificates", value: certificateCount ?? 0, icon: <Certificate size={18} weight="duotone" />, accent: "amber" as const },
  ];

  return (
    <div className="p-5 sm:p-6 md:p-10 max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          Profile
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
          Your account, and how the hub looks to you.
        </p>
      </header>

      {/* Two columns on wide screens: the account on the left, everything about
          your learning on the right. Collapses to one column below lg. */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 items-start">
        <div className="space-y-6">
          <div className="card p-6 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ background: "var(--primary)", color: "var(--on-primary)" }}
            >
              {(patient?.name || patient?.email || "P")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                {patient?.name || "Learner"}
              </p>
              <p className="text-sm truncate" style={{ color: "var(--foreground-secondary)" }}>
                {patient?.email}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className="text-[11px] font-semibold px-2 py-1 rounded-full leading-none"
                  style={
                    allAccess
                      ? { background: "var(--accent-indigo-light)", color: "var(--accent-indigo)" }
                      : selected
                        ? { background: "var(--accent-blue-light)", color: "var(--accent-blue)" }
                        : { background: "var(--card-secondary)", color: "var(--foreground-secondary)" }
                  }
                >
                  {allAccess ? "All Access" : selected ? "Selected Courses" : "Single Course"}
                </span>
                {patient?.created_at && (
                  <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    Member since {new Date(patient.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DisplayNameCard currentName={patient?.name || ""} />
          <PasswordCard recoveryHint="If you forget it, your care team can set a new one for you." />
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Your learning</h2>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} accent={stat.accent} />
              ))}
            </div>
            <div
              className="flex items-center gap-4 mt-5 pt-4 flex-wrap"
              style={{ borderTop: "1px solid var(--border-light)" }}
            >
              <Link href="/my-learning" className="text-sm font-semibold inline-flex items-center gap-1.5" style={{ color: "var(--primary)" }}>
                My Learning <ArrowRight size={13} weight="bold" />
              </Link>
              <Link href="/certificates" className="text-sm font-semibold inline-flex items-center gap-1.5" style={{ color: "var(--primary)" }}>
                Certificates <ArrowRight size={13} weight="bold" />
              </Link>
            </div>
          </div>

          <AppearanceCard />

          <div className="card p-6">
            <h2 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>Access tier</h2>
            <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--foreground-secondary)" }}>
              {allAccess
                ? "You can take any number of courses at the same time."
                : selected
                  ? "Your care team chooses the courses assigned to you."
                  : "You take one course at a time. Finish your active course to request another."}
            </p>
            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
              Set by the CLP care team. Contact them if you need it changed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
