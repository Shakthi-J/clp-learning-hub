import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let patient = null;
  if (user) {
    const { data } = await supabase
      .from("patients")
      .select("name, email, role")
      .eq("auth_user_id", user.id)
      .single();
    patient = data;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <nav className="sticky top-0 z-50 border-b" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center  text-sm font-bold" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>CL</div>
            <span className="font-semibold text-base" style={{ color: "var(--foreground)" }}>CLP Learning Hub</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/courses" className="text-sm" style={{ color: "var(--foreground-secondary)" }}>Courses</Link>
            <Link href="/about" className="text-sm" style={{ color: "var(--foreground-secondary)" }}>About</Link>

            {patient ? (
              <Link
                href={patient.role === "admin" ? "/admin" : "/my-learning"}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg"
                style={{ background: "var(--primary-light)", color: "var(--primary)" }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center  text-xs font-bold"
                  style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                >
                  {(patient.name || patient.email || "U")[0].toUpperCase()}
                </div>
                <span className="font-medium">
                  {patient.name ? patient.name.split(" ")[0] : patient.email?.split("@")[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm px-4 py-2 rounded-lg"
                style={{ color: "var(--primary)", background: "var(--primary-light)" }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
      <main>{children}</main>
      <footer className="border-t mt-20 py-8" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>© {new Date().getFullYear()} Clinic Living Plus. All rights reserved.</p>
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>learn.cliniclivingplus.com</p>
        </div>
      </footer>
    </div>
  );
}