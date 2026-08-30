import type { ReactNode } from "react";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const TONES: Record<Tone, React.CSSProperties> = {
  success: { background: "var(--success-light)", color: "var(--success)" },
  warning: { background: "var(--warning-light)", color: "var(--warning)" },
  danger: { background: "var(--danger-light)", color: "var(--danger)" },
  info: { background: "var(--info-light)", color: "var(--info)" },
  primary: { background: "var(--primary-light)", color: "var(--primary)" },
  neutral: { background: "var(--card-secondary)", color: "var(--foreground-secondary)" },
};

export default function Badge({
  tone = "neutral",
  style,
  icon,
  children,
}: {
  tone?: Tone;
  /** Overrides the tone, for category hues resolved at runtime. */
  style?: React.CSSProperties;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full leading-none"
      style={style ?? TONES[tone]}
    >
      {icon}
      {children}
    </span>
  );
}
