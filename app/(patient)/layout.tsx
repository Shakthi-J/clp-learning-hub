import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/ui/AppShell";
import { type NavItem } from "@/components/ui/SidebarNav";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: patient } = await supabase
    .from("patients").select("name, email, role").eq("auth_user_id", user.id).single();
  if (patient?.role === "admin") redirect("/admin");
  if (patient?.role === "instructor") redirect("/instructor");

  const navItems: NavItem[] = [
    { href: "/my-learning", label: "My Learning", icon: "learning" },
    { href: "/courses", label: "Browse Courses", icon: "courses" },
    { href: "/certificates", label: "Certificates", icon: "certificates" },
    { href: "/profile", label: "Profile", icon: "profile" },
  ];

  return (
    <AppShell
      brandHref="/my-learning"
      roleLabel="Learner"
      navItems={navItems}
      userName={patient?.name || "Patient"}
      userEmail={patient?.email || ""}
    >
      {children}
    </AppShell>
  );
}
