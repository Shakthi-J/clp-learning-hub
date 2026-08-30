import { createClient } from "@/lib/supabase/server";
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
    { label: "Published Courses", value: totalCourses ?? 0, icon: "📚", accent: "blue" as const },
    { label: "Total Patients", value: totalPatients ?? 0, icon: "👥", accent: "purple" as const },
    { label: "Pending Requests", value: pendingRequests ?? 0, icon: "📋", accent: "warning" as const, highlight: (pendingRequests ?? 0) > 0 },
    { label: "Active Enrollments", value: activeEnrollments ?? 0, icon: "🎓", accent: "teal" as const },
  ];
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8"><h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Dashboard</h1><p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>CLP Learning Hub overview</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} accent={stat.accent} highlight={stat.highlight} />
        ))}
      </div>
      <div>
        <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: "/admin/courses/new", label: "Create New Course", icon: "➕", desc: "Add a course to the catalog" },
            { href: "/admin/enrollments", label: "Review Requests", icon: "📋", desc: `${pendingRequests ?? 0} pending enrollment${(pendingRequests ?? 0) !== 1 ? "s" : ""}` },
            { href: "/admin/patients", label: "Manage Patients", icon: "👥", desc: "Set access tiers, view progress" },
          ].map((action) => (
            <a key={action.href} href={action.href} className="card card-hover p-5 block">
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="font-semibold text-sm mb-1" style={{ color: "var(--foreground)" }}>{action.label}</div>
              <div className="text-xs" style={{ color: "var(--foreground-secondary)" }}>{action.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
