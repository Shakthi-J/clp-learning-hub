"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EnrollButton({ courseId, isLoggedIn }: { courseId: string; isLoggedIn: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const submitRequest = async () => {
    setLoading(true);
    setMessage(null);
    setShowConfirm(false);
    const res = await fetch("/api/enrollments/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Enrollment request sent! You will hear from us soon." });
    } else {
      setMessage({ type: data.code === "ACTIVE_ENROLLMENT" ? "info" : "error", text: data.message || "Something went wrong." });
    }
  };

  const handleRequest = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }

    // Check if patient already completed this course
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: patient } = await supabase
      .from("patients").select("id").eq("auth_user_id", user.id).single();

    // A learner can hold more than one completed enrollment for a course, since
    // the unique index only constrains active rows. .single() threw on that,
    // which skipped the confirmation and let a duplicate request through.
    const { data: completed } = await supabase
      .from("enrollments")
      .select("id")
      .eq("patient_id", patient?.id)
      .eq("course_id", courseId)
      .eq("status", "completed")
      .limit(1)
      .maybeSingle();

    if (completed) {
      // Already completed — show confirmation popup
      setShowConfirm(true);
      return;
    }

    await submitRequest();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Confirmation popup */}
      {showConfirm && (
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--warning)", background: "var(--warning-light)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--warning)" }}>
            You have already completed this course
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--foreground-secondary)" }}>
            Would you like to request enrollment again to retake it?
          </p>
          <div className="flex gap-2">
            <button
              onClick={submitRequest}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold primary-gradient disabled:opacity-60"
            >
              {loading ? "Requesting..." : "Yes, Request Again"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold border"
              style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showConfirm && (
        <button
          onClick={handleRequest}
          disabled={loading || message?.type === "success"}
          className="px-6 py-3 rounded-xl text-white font-semibold text-sm primary-gradient disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Requesting..." : message?.type === "success" ? "Request Sent" : isLoggedIn ? "Request Enrollment" : "Sign In to Enroll"}
        </button>
      )}

      {message && !showConfirm && (
        <p className="text-xs text-center px-2"
          style={{ color: message.type === "success" ? "var(--success)" : message.type === "info" ? "var(--warning)" : "var(--danger)" }}>
          {message.text}
        </p>
      )}
    </div>
  );
}