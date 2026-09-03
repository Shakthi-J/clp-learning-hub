"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";
import SidebarNav, { type NavItem } from "./SidebarNav";
import SignOutButton from "@/components/SignOutButton";

type Props = {
  brandHref: string;
  roleLabel: string;
  navItems: NavItem[];
  userName: string;
  userEmail: string;
  children: React.ReactNode;
};

/**
 * The shell every signed-in role shares: sidebar, brand, account footer.
 *
 * On a phone the sidebar would eat two thirds of the width, so below lg it
 * becomes a drawer behind a header button and the content gets the full
 * screen. From lg up it is the ordinary static column it always was.
 */
export default function AppShell({
  brandHref, roleLabel, navItems, userName, userEmail, children,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Following a link inside the drawer should leave you on the new page, not
  // staring at the menu you tapped through.
  useEffect(() => { setOpen(false); }, [pathname]);

  // A drawer over the page must not let the page scroll behind it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const initial = (userName || userEmail || "?")[0].toUpperCase();

  const brand = (
    <Link href={brandHref} className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold tracking-tight flex-shrink-0"
        style={{ background: "var(--primary)", color: "var(--on-primary)" }}
      >
        CL
      </div>
      <div className="leading-tight">
        <p className="font-semibold text-sm tracking-tight" style={{ color: "var(--foreground)" }}>
          Learning Hub
        </p>
        <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>{roleLabel}</p>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen lg:flex" style={{ background: "var(--background)" }}>
      {/* Phone header. Hidden once the sidebar is permanently visible. */}
      <header
        className="print-hidden lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 sidebar-surface"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="-ml-2 p-2 rounded-xl"
          style={{ color: "var(--foreground-secondary)" }}
        >
          <List size={22} weight="bold" />
        </button>
        {brand}
      </header>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(15, 23, 42, 0.5)" }}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "sidebar-surface flex flex-col w-64 flex-shrink-0",
          // Phone: a drawer that slides in from the left, above the overlay.
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          // Desktop: back to a static column, always in view.
          "lg:static lg:translate-x-0 lg:transition-none",
        ].join(" ")}
        style={{ minHeight: "100dvh" }}
        aria-label="Main navigation"
      >
        <div
          className="p-5 flex items-center justify-between gap-2"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {brand}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="lg:hidden p-1.5 rounded-lg"
            style={{ color: "var(--foreground-muted)" }}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <SidebarNav items={navItems} />

        <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-3 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{ background: "var(--primary)", color: "var(--on-primary)" }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                {userName || "Account"}
              </p>
              <p className="text-[11px] truncate" style={{ color: "var(--foreground-muted)" }}>
                {userEmail}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* min-w-0 stops a wide child (a table, a long word) forcing the whole
          page to scroll sideways instead of scrolling inside its own box. */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
