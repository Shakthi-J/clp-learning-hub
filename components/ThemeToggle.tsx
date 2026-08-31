"use client";
import { useEffect, useState } from "react";
import { Sun, Moon, Desktop } from "@phosphor-icons/react";

export type Theme = "light" | "system" | "dark";

export const THEME_KEY = "clp-theme";

/**
 * Applies a theme by class. globals.css defines light on :root, dark under
 * .dark, and the OS preference under :root:not(.light) - so "system" is the
 * absence of both classes rather than a third set of values.
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "light") root.classList.add("light");
  if (theme === "dark") root.classList.add("dark");
}

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Desktop },
  { value: "dark", label: "Dark", icon: Moon },
];

export default function ThemeToggle() {
  // Starts as null so the control renders unselected on the server and picks up
  // the stored value on mount - the inline script in layout.tsx has already
  // applied it visually, so there is no flash either way.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {
      // Private mode or blocked storage: fall back to following the OS.
    }
    setTheme(stored === "light" || stored === "dark" ? stored : "system");
  }, []);

  const choose = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Not persisting is survivable; the choice still applies for this visit.
    }
  };

  return (
    <div
      className="inline-flex p-1 rounded-xl gap-1"
      role="radiogroup"
      aria-label="Colour theme"
      style={{ background: "var(--card-secondary)" }}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={active}
            onClick={() => choose(option.value)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={
              active
                ? { background: "var(--card)", color: "var(--foreground)", boxShadow: "var(--shadow-sm)" }
                : { color: "var(--foreground-muted)" }
            }
          >
            <Icon size={14} weight={active ? "fill" : "regular"} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
