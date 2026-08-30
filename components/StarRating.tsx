"use client";
import { useState } from "react";
import { Star } from "@phosphor-icons/react";

const GOLD = "var(--accent-amber)";
const EMPTY = "var(--border)";

/** Read-only rating. Renders partial stars by clipping a filled row over an empty one. */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <span
      className="relative inline-flex leading-none flex-shrink-0"
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      <span className="flex gap-0.5" style={{ color: EMPTY }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} weight="fill" />
        ))}
      </span>
      <span
        className="absolute inset-0 flex gap-0.5 overflow-hidden"
        style={{ width: `${pct}%`, color: GOLD }}
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} weight="fill" className="flex-shrink-0" />
        ))}
      </span>
    </span>
  );
}

/** Interactive 1-5 picker with hover preview. */
export default function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          disabled={disabled}
          onMouseEnter={() => setHover(star)}
          onClick={() => onChange(star)}
          className="p-0.5 rounded transition-transform duration-150 hover:scale-110 active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
          style={{ color: star <= shown ? GOLD : EMPTY }}
        >
          <Star size={26} weight={star <= shown ? "fill" : "regular"} />
        </button>
      ))}
      {shown > 0 && (
        <span className="ml-2 text-xs font-mono" style={{ color: "var(--foreground-muted)" }}>
          {shown}/5
        </span>
      )}
    </div>
  );
}
