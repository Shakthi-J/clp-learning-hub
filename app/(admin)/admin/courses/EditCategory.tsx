"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { categoryPillStyle } from "@/lib/categoryColor";

/**
 * An editable category on a course row. A plain text input rather than a
 * closed dropdown - categories are free text (lib/categoryColor hashes
 * whatever string it's given), so this has to allow a brand new one, not
 * just a pick from what already exists. The datalist is what supplies the
 * "existing categories" convenience without turning it into a strict enum.
 */
export default function EditCategory({
  courseId,
  category,
  existingCategories,
}: {
  courseId: string;
  category: string | null;
  existingCategories: string[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(category ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const trimmed = value.trim();
    if (trimmed === (category ?? "")) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: trimmed || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Could not save");
      setValue(category ?? "");
      return;
    }
    router.refresh();
  };

  const listId = `categories-${courseId}`;

  return (
    <div className="inline-flex flex-col">
      <input
        list={listId}
        value={value}
        disabled={saving}
        placeholder="No category"
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="text-[11px] font-semibold px-2 py-1 rounded-full leading-none border-0 outline-none disabled:opacity-60 w-32"
        style={value ? categoryPillStyle(value) : { background: "var(--card-secondary)", color: "var(--foreground-muted)" }}
      />
      <datalist id={listId}>
        {existingCategories.map((c) => <option key={c} value={c} />)}
      </datalist>
      {error && <p className="text-[10px] mt-0.5" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
