import { createClient } from "@/lib/supabase/server";
import { ArrowRight } from "@phosphor-icons/react/ssr";
import { BookOpen, CheckCircle, PlayCircle, Certificate } from "@phosphor-icons/react/ssr";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileForm from "./ProfileForm";
import StatCard from "@/components/StatCard";

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

  const stats = [
    { label: "Active Courses", value: active, icon: <BookOpen size={18} weight="duotone" />, accent: "blue" as const },
    { label: "Completed", value: completed, icon: <CheckCircle size={18} weight="duotone" />, accent: "teal" as const },
    { label: "Lessons Finished", value: lessonsDone, icon: <PlayCircle size={18} weight="duotone" />, accent: "purple" as const },
    { label: "Certificates", value: certificateCount ?? 0, icon: <Certificate size={18} weight="duotone" />, accent: "amber" as const },
  ];

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Profile</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
          Your account details and learning summary
        </p>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center  text-lg font-bold flex-shrink-0"
            style={{ background: "var(--primary)", color: "var(--on-primary)" }}
          >
            {(patient?.name || patient?.email || "P")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>
              {patient?.name || "Patient"}
            </p>
            <p className="text-sm truncate" style={{ color: "var(--foreground-secondary)" }}>
              {patient?.email}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: patient?.access_type === "all_access" ? "var(--accent-indigo-light)" : "var(--card-secondary)",
                  color: patient?.access_type === "all_access" ? "var(--accent-indigo)" : "var(--foreground-secondary)",
                }}
              >
                {patient?.access_type === "all_access" ? "All Access" : "Single Course"}
              </span>
              {patient?.created_at && (
                <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                  Member since {new Date(patient.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        <ProfileForm currentName={patient?.name || ""} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 stagger">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} accent={stat.accent} />
        ))}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>Access tier</h2>
        <p className="text-sm mb-4" style={{ color: "var(--foreground-secondary)" }}>
          {patient?.access_type === "all_access"
            ? "You can enroll in any number of courses at the same time."
            : "You can take one course at a time. Finish your active course to request another."}
        </p>
        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
          Your access tier is set by the CLP care team. Contact them if you need it changed.
        </p>
      </div>

      <div className="mt-6 flex gap-3 flex-wrap">
        <Link href="/my-learning" className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
          <span className="inline-flex items-center gap-1.5">My Learning <ArrowRight size={13} weight="bold" /></span>
        </Link>
        <Link href="/certificates" className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
          <span className="inline-flex items-center gap-1.5">Certificates <ArrowRight size={13} weight="bold" /></span>
        </Link>
      </div>
    </div>
  );
}
