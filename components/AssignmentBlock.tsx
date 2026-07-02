"use client";
import { useState } from "react";

interface AssignmentBlockProps {
  assignmentId: string;
  enrollmentId: string;
  title: string;
  prompt: string;
  existingSubmission: {
    id: string;
    response: string;
    status: string;
    feedback: string | null;
    submitted_at: string;
  } | null;
}

export default function AssignmentBlock({
  assignmentId, enrollmentId, title, prompt, existingSubmission,
}: AssignmentBlockProps) {
  const [response, setResponse] = useState(existingSubmission?.response || "");
  const [submission, setSubmission] = useState(existingSubmission);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(!existingSubmission);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!response.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/assignments/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, enrollmentId, response }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.message || "Failed to submit."); return; }
    setSubmission(data.submission);
    setEditing(false);
  };

  const statusStyle = (status: string) => {
    if (status === "approved") return { background: "#e8f5e9", color: "#2e7d32" };
    if (status === "needs_revision") return { background: "#fef2f2", color: "#dc2626" };
    return { background: "var(--beige-light)", color: "var(--foreground-secondary)" };
  };

  const statusLabel = (status: string) => {
    if (status === "approved") return "✓ Approved";
    if (status === "needs_revision") return "Needs Revision";
    return "Under Review";
  };

  return (
    <div className="card p-6 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📋</span>
        <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>{title}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full ml-auto"
          style={{ background: "var(--secondary-light)", color: "var(--primary)" }}>
          Assignment
        </span>
      </div>

      <div className="rounded-xl p-4 mb-4" style={{ background: "var(--card-secondary)", border: "1px solid var(--border)" }}>
        <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Your Task:</p>
        <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>{prompt}</p>
      </div>

      {submission && !editing && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: "var(--foreground-secondary)" }}>Your Submission</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={statusStyle(submission.status)}>
              {statusLabel(submission.status)}
            </span>
          </div>
          <div className="rounded-xl p-4 mb-3" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{submission.response}</p>
          </div>
          {submission.feedback && (
            <div className="rounded-xl p-4 mb-3" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--warning)" }}>Feedback from CLP team:</p>
              <p className="text-sm" style={{ color: "var(--foreground)" }}>{submission.feedback}</p>
            </div>
          )}
          {submission.status === "needs_revision" && (
            <button onClick={() => setEditing(true)} className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
              Edit and Resubmit
            </button>
          )}
        </div>
      )}

      {editing && (
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
            Your Response
          </label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={6}
            placeholder="Type your response here..."
            className="w-full px-4 py-3 rounded-xl border text-sm resize-none mb-3"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}
          />
          {error && <p className="text-xs mb-2" style={{ color: "var(--danger)" }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={loading || !response.trim()}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60">
              {loading ? "Submitting..." : "Submit Assignment"}
            </button>
            {submission && (
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm border"
                style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
