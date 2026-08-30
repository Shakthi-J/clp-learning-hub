import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 gap-2 rounded-xl",
  lg: "text-sm px-6 py-3 gap-2 rounded-xl",
};

function styleFor(variant: Variant): React.CSSProperties {
  switch (variant) {
    case "primary":
      return { background: "var(--primary)", color: "var(--on-primary)", boxShadow: "var(--shadow-sm)" };
    case "secondary":
      return { background: "var(--card)", color: "var(--foreground-secondary)", border: "1px solid var(--border)" };
    case "danger":
      return { background: "var(--danger)", color: "#fff" };
    case "ghost":
      return { background: "transparent", color: "var(--foreground-secondary)" };
  }
}

const BASE =
  "inline-flex items-center justify-center font-semibold whitespace-nowrap " +
  "transition-[transform,box-shadow,background-color,opacity] duration-200 " +
  "disabled:opacity-50 disabled:pointer-events-none hover:brightness-[0.97] active:scale-[0.98]";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  children,
  className = "",
  ...rest
}: BaseProps & Omit<ComponentProps<"button">, "className">) {
  return (
    <button className={`${BASE} ${SIZES[size]} ${className}`} style={styleFor(variant)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  children,
  className = "",
  ...rest
}: BaseProps & ComponentProps<typeof Link>) {
  return (
    <Link className={`${BASE} ${SIZES[size]} ${className}`} style={styleFor(variant)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}
