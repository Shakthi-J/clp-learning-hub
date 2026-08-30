"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Plus, Spinner } from "@phosphor-icons/react";

type Course = { id: string; title: string; category: string | null; instructor_id: string | null };

/**
 * Which courses a learner has been given. Admins see every course; instructors
 * see only their own, matching what the API will actually let them assign.
 */
export default function CourseAccessPicker({
  patientId,
  actorRole,
  actorId,
}: {
  patientId: string;
  actorRole: string;
  actorId: string;
}) {
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    let query = supabase.from("courses").select("id, title, category, instructor_id").order("title");
    if (actorRole !== "admin") query = query.eq("instructor_id", actorId);
    const [{ data: courseRows }, { data: accessRows }] = await Promise.all([
      query,
      supabase.from("patient_course_access").select("course_id").eq("patient_id", patientId),
    ]);
    setCourses((courseRows as Course[]) || []);
    setGranted(new Set(((accessRows as any[]) || []).map((r) => r.course_id)));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [patientId]);

  const toggle = async (course: Course) => {
    const isGranted = granted.has(course.id);
    setBusyId(course.id);
    setMessage(null);

    const res = isGranted
      ? await fetch(`/api/patients/${patientId}/courses?courseId=${course.id}`, { method: "DELETE" })
      : await fetch(`/api/patients/${patientId}/courses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: course.id }),
        });

    const data = await res.json().catch(() => ({}));
    setBusyId(null);

    if (!res.ok) {
      setMessage({ type: "err", text: data.message || "Could not update access" });
      return;
    }

    setGranted((prev) => {
      const next = new Set(prev);
      isGranted ? next.delete(course.id) : next.add(course.id);
      return next;
    });
    setMessage({
      type: "ok",
      text: isGranted
        ? (data.message ?? "Access removed.")
        : `${course.title} assigned. It is in their My Learning now.`,
    });
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

  return (
    <div>
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {courses.map((course) => {
          const isGranted = granted.has(course.id);
          return (
            <button
              key={course.id}
              onClick={() => toggle(course)}
              disabled={busyId === course.id}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-left text-sm disabled:opacity-60"
              style={{
                borderColor: isGranted ? "var(--primary)" : "var(--border)",
                background: isGranted ? "var(--primary-light)" : "var(--card)",
                color: isGranted ? "var(--primary)" : "var(--foreground-secondary)",
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
              {busyId === course.id ? (
                <Spinner size={14} className="animate-spin flex-shrink-0" />
              ) : isGranted ? (
                <Check size={14} weight="bold" className="flex-shrink-0" />
              ) : (
                <Plus size={14} weight="bold" className="flex-shrink-0" style={{ color: "var(--foreground-muted)" }} />
              )}
            </button>
          );
        })}
      </div>
      {message && (
        <p className="text-[11px] mt-2" style={{ color: message.type === "ok" ? "var(--success)" : "var(--danger)" }}>
          {message.text}
        </p>
      )}
    </div>
  );
}
