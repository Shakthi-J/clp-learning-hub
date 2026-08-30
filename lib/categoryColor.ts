/**
 * Maps a free-text category to one of the accent hues, deterministically.
 * The same category always gets the same colour across every page, without
 * anyone having to configure it when a new category is typed in the admin panel.
 */

const ACCENTS = ["blue", "purple", "teal", "rose", "amber", "indigo"] as const;

export type Accent = (typeof ACCENTS)[number];

export function accentFor(value: string | null | undefined): Accent {
  if (!value) return "blue";
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return ACCENTS[hash % ACCENTS.length];
}

/** Inline style for a category pill: tinted background, saturated text. */
export function categoryPillStyle(value: string | null | undefined) {
  const accent = accentFor(value);
  return {
    background: `var(--accent-${accent}-light)`,
    color: `var(--accent-${accent})`,
  };
}

/** Just the solid colour, for bars, dots and icon backgrounds. */
export function categoryColor(value: string | null | undefined) {
  return `var(--accent-${accentFor(value)})`;
}
