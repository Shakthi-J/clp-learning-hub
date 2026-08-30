import type { ReactNode } from "react";

/** Composed empty state: an icon in a tinted well, a reason, and a way forward. */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "var(--primary)",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: string;
}) {
  return (
    <div
      className="rise flex flex-col items-center text-center px-6 py-16 rounded-2xl border"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: `color-mix(in srgb, ${tone} 12%, transparent)`, color: tone }}
      >
        {icon}
      </div>
      <h3 className="font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-[46ch] mb-6" style={{ color: "var(--foreground-secondary)" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
