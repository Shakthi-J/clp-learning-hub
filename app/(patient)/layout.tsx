import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: patient } = await supabase.from("patients").select("name, email, role").eq("auth_user_id", user.id).single();
  if (patient?.role === "admin") redirect("/admin");
  const navItems = [
    { href: "/my-learning", label: "My Learning", icon: "🎓" },
    { href: "/courses", label: "Browse Courses", icon: "📚" },
    { href: "/certificates", label: "Certificates", icon: "🏆" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ];
  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      <aside className="w-64 flex-shrink-0 flex flex-col sidebar-surface" style={{ minHeight: "100vh" }}>
        <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/my-learning" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: "var(--primary)" }}>CL</div>
            <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Learning Hub</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium" style={{ color: "var(--foreground-secondary)" }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--primary)" }}>
              {(patient?.name || patient?.email || "P")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{patient?.name || "Patient"}</p>
              <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>{patient?.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
