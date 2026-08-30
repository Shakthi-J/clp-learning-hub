"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Instructor = { id: string; name: string | null; email: string | null };

export default function AssignInstructor({
  courseId,
  instructorId,
  instructors,
}: {
  courseId: string;
  instructorId: string | null;
  instructors: Instructor[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assign = async (value: string) => {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // Empty string means "unassign" — send null, not "".
      body: JSON.stringify({ instructor_id: value || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Could not assign");
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <select
        value={instructorId ?? ""}
        disabled={saving}
        onChange={(e) => assign(e.target.value)}
        className="text-xs px-2 py-1 rounded-lg border disabled:opacity-60"
        style={{
          borderColor: "var(--border)",
          background: instructorId ? "var(--secondary-light)" : "var(--card)",
          color: "var(--foreground-secondary)",
        }}
      >
        <option value="">Unassigned (admin)</option>
        {instructors.map((instructor) => (
          <option key={instructor.id} value={instructor.id}>
            {instructor.name || instructor.email}
          </option>
        ))}
      </select>
      {error && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
