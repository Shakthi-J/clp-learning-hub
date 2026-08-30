import { getActor } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import SidebarNav, { type NavItem } from "@/components/ui/SidebarNav";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (actor.role !== "instructor" && actor.role !== "admin") redirect("/my-learning");

  const navItems: NavItem[] = [
    { href: "/instructor", label: "Dashboard", icon: "dashboard" },
    { href: "/instructor/courses", label: "My Courses", icon: "courses" },
    { href: "/instructor/learners", label: "Learners", icon: "people" },
    { href: "/instructor/assignments", label: "Grading", icon: "grading" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      <aside className="w-64 flex-shrink-0 flex flex-col sidebar-surface" style={{ minHeight: "100dvh" }}>
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/instructor" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center  text-[11px] font-bold tracking-tight" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>CL</div>
            <div className="leading-tight">
              <p className="font-semibold text-sm tracking-tight" style={{ color: "var(--foreground)" }}>Learning Hub</p>
              <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>Instructor</p>
            </div>
          </Link>
        </div>

        <SidebarNav items={navItems} />

        {actor.role === "admin" && (
          <div className="px-3 pb-2">
            <Link href="/admin" className="block text-[11px] px-3 py-2 rounded-lg text-center transition-colors" style={{ background: "var(--card-secondary)", color: "var(--foreground-secondary)" }}>
              Viewing as admin - Admin panel
            </Link>
          </div>
        )}

        <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center  text-[11px] font-bold flex-shrink-0" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
              {(actor.name || actor.email || "I")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{actor.name || "Instructor"}</p>
              <p className="text-[11px] truncate" style={{ color: "var(--foreground-muted)" }}>{actor.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
