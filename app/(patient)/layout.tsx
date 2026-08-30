import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import SidebarNav, { type NavItem } from "@/components/ui/SidebarNav";
export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: patient } = await supabase.from("patients").select("name, email, role").eq("auth_user_id", user.id).single();
  if (patient?.role === "admin") redirect("/admin");
  if (patient?.role === "instructor") redirect("/instructor");
  const navItems: NavItem[] = [
    { href: "/my-learning", label: "My Learning", icon: "learning" },
    { href: "/courses", label: "Browse Courses", icon: "courses" },
    { href: "/certificates", label: "Certificates", icon: "certificates" },
    { href: "/profile", label: "Profile", icon: "profile" },
  ];
  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      <aside className="w-64 flex-shrink-0 flex flex-col sidebar-surface" style={{ minHeight: "100dvh" }}>
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/my-learning" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center  text-[11px] font-bold tracking-tight" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>CL</div>
            <div className="leading-tight">
              <p className="font-semibold text-sm tracking-tight" style={{ color: "var(--foreground)" }}>Learning Hub</p>
              <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>Learner</p>
            </div>
          </Link>
        </div>

        <SidebarNav items={navItems} />

        <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center  text-[11px] font-bold flex-shrink-0" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
              {(patient?.name || patient?.email || "P")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{patient?.name || "Patient"}</p>
              <p className="text-[11px] truncate" style={{ color: "var(--foreground-muted)" }}>{patient?.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
