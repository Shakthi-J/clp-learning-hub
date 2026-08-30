import type { ReactNode } from "react";

/** Consistent page title block: eyebrow, title, description, and optional actions. */
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex items-start justify-between gap-6 flex-wrap">
      <div className="min-w-0">
        {eyebrow && (
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2"
            style={{ color: "var(--primary)" }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="text-2xl md:text-3xl font-semibold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-2 max-w-[60ch]" style={{ color: "var(--foreground-secondary)" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  );
}
