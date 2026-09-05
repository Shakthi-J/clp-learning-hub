"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Plus } from "@phosphor-icons/react";

type Course = { id: string; title: string; category: string | null; instructor_id: string | null };

/**
 * Which courses a learner has been given. Admins see every course; instructors
 * see only their own, matching what the API will actually let them assign.
 *
 * Selections are local until "Save changes" is pressed - picking three
 * courses used to mean three separate round trips with no way to review
 * before committing; now it's one batch, applied together, with the
 * confirmation button in the same place regardless of tier.
 */
export default function CourseAccessPicker({
  patientId,
  actorRole,
  actorId,
  maxSelectable,
}: {
  patientId: string;
  actorRole: string;
  actorId: string;
  /** Caps how many courses can be selected at once - the Single Course tier
   *  passes 1 here so it stays a single pass rather than turning into
   *  Selected Courses by accident. Omit for no cap. */
  maxSelectable?: number;
}) {
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    let query = supabase.from("courses").select("id, title, category, instructor_id").order("title");
    if (actorRole !== "admin") query = query.eq("instructor_id", actorId);
    const [{ data: courseRows }, { data: accessRows }] = await Promise.all([
      query,
      supabase.from("patient_course_access").select("course_id").eq("patient_id", patientId),
    ]);
    setCourses((courseRows as Course[]) || []);
    const current = new Set(((accessRows as any[]) || []).map((r) => r.course_id));
    setGranted(current);
    setPending(new Set(current));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [patientId]);

  const toggle = (courseId: string) => {
    setMessage(null);
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        if (maxSelectable != null && next.size >= maxSelectable) return prev.has(courseId) ? prev : next; // capped, no-op
        next.add(courseId);
      }
      return next;
    });
  };

  const dirty = pending.size !== granted.size || Array.from(pending).some((id) => !granted.has(id));

  const save = async () => {
    setSaving(true);
    setMessage(null);

    const toGrant = Array.from(pending).filter((id) => !granted.has(id));
    const toRevoke = Array.from(granted).filter((id) => !pending.has(id));

    const results = await Promise.all([
      ...toGrant.map((courseId) =>
        fetch(`/api/patients/${patientId}/courses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        })
      ),
      ...toRevoke.map((courseId) =>
        fetch(`/api/patients/${patientId}/courses?courseId=${courseId}`, { method: "DELETE" })
      ),
    ]);

    setSaving(false);
    const failures = results.filter((r) => !r.ok).length;

    if (failures > 0) {
      setMessage({ type: "err", text: `${failures} change${failures === 1 ? "" : "s"} failed. Try again.` });
      await load();
      return;
    }

    setGranted(new Set(pending));
    setMessage({ type: "ok", text: "Saved. It's in their My Learning now." });
  };

  if (loading) {
    return <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="skeleton h-9 rounded-lg" />)}</div>;
  }

  if (courses.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
        {actorRole === "admin" ? "No courses exist yet." : "You do not own any courses to assign."}
      </p>
    );
  }

  const atCap = maxSelectable != null && pending.size >= maxSelectable;

  return (
    <div>
      {atCap && (
        <p className="text-[11px] mb-2" style={{ color: "var(--foreground-muted)" }}>
          {maxSelectable === 1 ? "One course picked. Remove it to pick a different course." : `Limit of ${maxSelectable} reached. Remove one to pick another.`}
        </p>
      )}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {courses.map((course) => {
          const isSelected = pending.has(course.id);
          const disabled = !isSelected && atCap;
          return (
            <button
              key={course.id}
              onClick={() => toggle(course.id)}
              disabled={disabled}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-left text-sm disabled:opacity-60"
              style={{
                borderColor: isSelected ? "var(--primary)" : "var(--border)",
                background: isSelected ? "var(--primary-light)" : "var(--card)",
                color: isSelected ? "var(--primary)" : "var(--foreground-secondary)",
              }}
            >
              <span className="min-w-0 truncate">
                {course.title}
                {course.category && (
                  <span className="text-[11px] ml-2" style={{ color: "var(--foreground-muted)" }}>
                    {course.category}
                  </span>
                )}
              </span>
              {isSelected ? (
                <Check size={14} weight="bold" className="flex-shrink-0" />
              ) : (
                <Plus size={14} weight="bold" className="flex-shrink-0" style={{ color: "var(--foreground-muted)" }} />
              )}
            </button>
          );
        })}
      </div>
      <button
        onClick={save}
        disabled={saving || !dirty}
        className="mt-3 text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
        style={{ background: "var(--primary)", color: "var(--on-primary)" }}
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
      {message && (
        <p className="text-[11px] mt-2" style={{ color: message.type === "ok" ? "var(--success)" : "var(--danger)" }}>
          {message.text}
        </p>
      )}
    </div>
  );
}
