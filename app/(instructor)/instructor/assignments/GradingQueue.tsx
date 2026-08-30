"use client";
import { useState } from "react";
import { PencilLine } from "@phosphor-icons/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Submission = {
  id: string;
  response: string;
  status: string;
  submitted_at: string;
  feedback: string | null;
  patients: { name: string; email: string } | null;
  assignments: { title: string; prompt: string } | null;
};

const TABS = [
  { value: "submitted", label: "Awaiting review" },
  { value: "approved", label: "Approved" },
  { value: "needs_revision", label: "Needs revision" },
];

export default function GradingQueue({
  submissions,
  activeStatus,
}: {
  submissions: Submission[];
  activeStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [reviewing, setReviewing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const switchTab = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", status);
    router.push(`${pathname}?${params.toString()}`);
  };

  const review = async (id: string, status: "approved" | "needs_revision") => {
    setActing(id);
    setError(null);
    const res = await fetch(`/api/assignments/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, feedback }),
    });
    setActing(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Could not save review");
      return;
    }
    setReviewing(null);
    setFeedback("");
    router.refresh();
  };

  return (
    <>
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((tab) => {
          const active = activeStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => switchTab(tab.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border"
              style={
                active
                  ? { background: "var(--primary)", borderColor: "var(--primary)", color: "var(--on-primary)" }
                  : { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground-secondary)" }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs mb-4" style={{ color: "var(--danger)" }}>{error}</p>
      )}

      {submissions.length > 0 ? (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
                    {submission.assignments?.title || "Assignment"}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                    {submission.patients?.name || "Learner"} · {submission.patients?.email} ·{" "}
                    {submission.submitted_at
                      ? new Date(submission.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </p>
                </div>
              </div>

              {submission.assignments?.prompt && (
                <p className="text-xs mb-3 p-3 rounded-xl" style={{ background: "var(--card-secondary)", color: "var(--foreground-secondary)" }}>
                  {submission.assignments.prompt}
                </p>
              )}

              <p className="text-sm whitespace-pre-wrap mb-4" style={{ color: "var(--foreground)" }}>
                {submission.response}
              </p>

              {submission.feedback && (
                <p className="text-xs mb-4 p-3 rounded-xl" style={{ background: "var(--beige-light)", color: "var(--foreground-secondary)" }}>
                  <span className="font-semibold">Previous feedback:</span> {submission.feedback}
                </p>
              )}

              {submission.status === "submitted" && (
                reviewing === submission.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Feedback for the learner (optional for approval, recommended for revisions)"
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => review(submission.id, "approved")}
                        disabled={acting === submission.id}
                        className="text-sm font-semibold px-4 py-2 rounded-xl  disabled:opacity-60"
                        style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                      >
                        {acting === submission.id ? "Saving…" : "Approve"}
                      </button>
                      <button
                        onClick={() => review(submission.id, "needs_revision")}
                        disabled={acting === submission.id}
                        className="text-sm font-semibold px-4 py-2 rounded-xl text-white disabled:opacity-60"
                        style={{ background: "var(--warning)" }}
                      >
                        Request revision
                      </button>
                      <button
                        onClick={() => { setReviewing(null); setFeedback(""); }}
                        className="text-sm font-semibold px-4 py-2 rounded-xl border"
                        style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setReviewing(submission.id); setFeedback(""); }}
                    className="text-sm font-semibold px-4 py-2 rounded-xl "
                    style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                  >
                    Review
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "var(--warning-light)", color: "var(--warning)" }}><PencilLine size={22} weight="duotone" /></div>
          <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>Nothing here</h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--foreground-secondary)" }}>
            No submissions with this status in your courses.
          </p>
        </div>
      )}
    </>
  );
}
