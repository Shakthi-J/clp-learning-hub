import Link from "next/link";
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <nav className="sticky top-0 z-50 border-b" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: "var(--primary)" }}>CL</div>
            <span className="font-semibold text-base" style={{ color: "var(--foreground)" }}>CLP Learning Hub</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/courses" className="text-sm" style={{ color: "var(--foreground-secondary)" }}>Courses</Link>
            <Link href="/about" className="text-sm" style={{ color: "var(--foreground-secondary)" }}>About</Link>
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg" style={{ color: "var(--primary)", background: "var(--primary-light)" }}>Sign In</Link>
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
