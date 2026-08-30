"use client";
import { useState } from "react";

/** Read-only star display. Renders half-filled stars via a clipped overlay. */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className="relative inline-block leading-none" style={{ fontSize: size }} aria-hidden="true">
      <span style={{ color: "var(--border)" }}>★★★★★</span>
      <span
        className="absolute left-0 top-0 overflow-hidden whitespace-nowrap"
        style={{ width: `${pct}%`, color: "var(--warning)" }}
      >
        ★★★★★
      </span>
    </span>
  );
}

/** Interactive 1–5 picker. */
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
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          disabled={disabled}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="text-2xl leading-none disabled:opacity-60"
          style={{ color: star <= shown ? "var(--warning)" : "var(--border)" }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
