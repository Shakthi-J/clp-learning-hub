import { createClient } from "@/lib/supabase/server";
import { BookOpen, Users, ClipboardText, GraduationCap, Plus, ArrowRight } from "@phosphor-icons/react/ssr";
import StatCard from "@/components/StatCard";
export const metadata = { title: "Admin Dashboard" };
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [{ count: totalCourses }, { count: totalPatients }, { count: pendingRequests }, { count: activeEnrollments }] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("patients").select("*", { count: "exact", head: true }).eq("role", "patient"),
    supabase.from("enrollment_requests").select("*", { count: "exact", head: true }).eq("status", "requested"),
    supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);
  const stats = [
    { label: "Published Courses", value: totalCourses ?? 0, icon: <BookOpen size={18} weight="duotone" />, accent: "blue" as const },
    { label: "Total Patients", value: totalPatients ?? 0, icon: <Users size={18} weight="duotone" />, accent: "purple" as const },
    { label: "Pending Requests", value: pendingRequests ?? 0, icon: <ClipboardText size={18} weight="duotone" />, accent: "warning" as const, highlight: (pendingRequests ?? 0) > 0 },
    { label: "Active Enrollments", value: activeEnrollments ?? 0, icon: <GraduationCap size={18} weight="duotone" />, accent: "teal" as const },
  ];
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8"><h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Dashboard</h1><p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>CLP Learning Hub overview</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 stagger">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} accent={stat.accent} highlight={stat.highlight} />
        ))}
      </div>
      <div>
        <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: "/admin/courses/new", label: "Create a course", icon: <Plus size={18} weight="bold" />, desc: "Add a course to the catalog" },
            { href: "/admin/enrollments", label: "Review requests", icon: <ClipboardText size={18} weight="duotone" />, desc: `${pendingRequests ?? 0} pending enrollment${(pendingRequests ?? 0) !== 1 ? "s" : ""}` },
            { href: "/admin/patients", label: "Manage people", icon: <Users size={18} weight="duotone" />, desc: "Set access tiers, view progress" },
          ].map((action) => (
            <a key={action.href} href={action.href} className="card card-hover p-5 block group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{action.icon}</div>
              <div className="font-semibold text-sm mb-1" style={{ color: "var(--foreground)" }}>{action.label}</div>
              <div className="text-xs" style={{ color: "var(--foreground-secondary)" }}>{action.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
