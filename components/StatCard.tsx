export type StatAccent =
  | "blue" | "purple" | "teal" | "rose" | "amber" | "indigo"
  | "success" | "warning" | "danger" | "info" | "primary";

/** Solid and tinted colour for an accent, using only theme variables. */
function tokens(accent: StatAccent) {
  const named = ["success", "warning", "danger", "info", "primary"];
  if (named.includes(accent)) {
    // primary has --primary-light; the status colours have -light too.
    return { solid: `var(--${accent})`, tint: `var(--${accent}-light)` };
  }
  return { solid: `var(--accent-${accent})`, tint: `var(--accent-${accent}-light)` };
}

export default function StatCard({
  label,
  value,
  icon,
  accent = "blue",
  highlight = false,
}: {
  label: string;
  value: number | string;
  icon: string;
  accent?: StatAccent;
  /** Draws attention to a tile that needs action, e.g. a grading backlog. */
  highlight?: boolean;
}) {
  const { solid, tint } = tokens(accent);
  // A zero count shouldn't wear an attention colour - nothing needs attention.
  const isZero = value === 0 || value === "0";
  const valueColor = isZero ? "var(--foreground-muted)" : solid;

  return (
    <div
      className="card p-5"
      style={highlight ? { borderColor: solid, background: tint } : {}}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-3"
        style={{ background: tint }}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold" style={{ color: valueColor }}>
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
        {label}
      </div>
    </div>
  );
}
