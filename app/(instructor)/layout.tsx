import { getActor } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (actor.role !== "instructor" && actor.role !== "admin") redirect("/my-learning");

  const navItems = [
    { href: "/instructor", label: "Dashboard", icon: "📊" },
    { href: "/instructor/courses", label: "My Courses", icon: "📚" },
    { href: "/instructor/learners", label: "Learners", icon: "👥" },
    { href: "/instructor/assignments", label: "Grading", icon: "✍️" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      <aside className="w-64 flex-shrink-0 flex flex-col sidebar-surface" style={{ minHeight: "100vh" }}>
        <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/instructor" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: "var(--primary)" }}>CL</div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Learning Hub</p>
              <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Instructor</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium" style={{ color: "var(--foreground-secondary)" }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {actor.role === "admin" && (
          <div className="px-4 pb-2">
            <Link href="/admin" className="block text-xs px-3 py-2 rounded-lg text-center" style={{ background: "var(--beige-light)", color: "var(--foreground-secondary)" }}>
              Viewing as admin → Admin panel
            </Link>
          </div>
        )}

        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--primary)" }}>
              {(actor.name || actor.email || "I")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{actor.name || "Instructor"}</p>
              <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>{actor.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
