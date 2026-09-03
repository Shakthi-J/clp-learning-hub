"use client";
import { useState, useEffect } from "react";
import { ClipboardText } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

type Submission = {
  id: string;
  response: string;
  status: string;
  submitted_at: string;
  feedback: string | null;
  patients: { name: string; email: string } | null;
  assignments: { title: string; prompt: string } | null;
};

export default function AdminAssignmentsPage() {
  const supabase = createClient();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"submitted" | "approved" | "needs_revision">("submitted");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data } = await supabase.from("assignment_submissions")
      .select(`id, response, status, submitted_at, feedback,
        patients!assignment_submissions_patient_id_fkey (name, email),
        assignments (title, prompt)`)
      .eq("status", filter)
      .order("submitted_at", { ascending: false });
    setSubmissions((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); }, [filter]);

  const handleReview = async (id: string, status: "approved" | "needs_revision") => {
    setActing(id);
    await fetch(`/api/assignments/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, feedback }),
    });
    setActing(null); setReviewing(null); setFeedback("");
    fetchSubmissions();
  };

  return (
    <div className="p-5 sm:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Assignment Submissions</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>Review and give feedback on patient assignment submissions</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(["submitted", "approved", "needs_revision"] as const).map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)}
            className="px-4 py-2 rounded-xl text-sm font-semibold capitalize"
            style={filter === tab
              ? { background: "var(--primary)", color: "white" }
              : { background: "var(--card)", color: "var(--foreground-secondary)", border: "1px solid var(--border)" }}>
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? <div className="text-sm" style={{ color: "var(--foreground-muted)" }}>Loading...</div>
        : submissions.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "var(--warning-light)", color: "var(--warning)" }}><ClipboardText size={22} weight="duotone" /></div>
            <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              {filter === "submitted" ? "Nothing to grade" : filter === "approved" ? "No approved submissions" : "No submissions needing revision"}
            </h3>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                      {sub.patients?.name || sub.patients?.email}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                      {sub.assignments?.title} · {new Date(sub.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={sub.status === "approved" ? { background: "var(--success-light)", color: "var(--success)" }
                      : sub.status === "needs_revision" ? { background: "var(--danger-light)", color: "var(--danger)" }
                      : { background: "var(--beige-light)", color: "var(--foreground-secondary)" }}>
                    {sub.status.replace("_", " ")}
                  </span>
                </div>

                <div className="rounded-xl p-4 mb-3" style={{ background: "var(--card-secondary)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--foreground-secondary)" }}>Task: {sub.assignments?.prompt}</p>
                </div>

                <div className="rounded-xl p-4 mb-3" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--foreground-secondary)" }}>Patient Response:</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{sub.response}</p>
                </div>

                {sub.feedback && (
                  <div className="rounded-xl p-3 mb-3" style={{ background: "var(--warning-light)", border: "1px solid var(--warning-light)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--warning)" }}>Previous feedback:</p>
                    <p className="text-sm" style={{ color: "var(--foreground)" }}>{sub.feedback}</p>
                  </div>
                )}

                {filter === "submitted" && (
                  <div>
                    {reviewing === sub.id ? (
                      <div>
                        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
                          placeholder="Optional feedback for the patient..."
                          className="w-full px-3 py-2 rounded-xl border text-sm resize-none mb-3"
                          style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                        <div className="flex gap-2">
                          <button onClick={() => handleReview(sub.id, "approved")} disabled={acting === sub.id}
                            className="px-4 py-2 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60">
                            {acting === sub.id ? "..." : "Approve"}
                          </button>
                          <button onClick={() => handleReview(sub.id, "needs_revision")} disabled={acting === sub.id}
                            className="px-4 py-2 rounded-xl text-sm font-semibold border"
                            style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
                            {acting === sub.id ? "..." : "Needs Revision"}
                          </button>
                          <button onClick={() => { setReviewing(null); setFeedback(""); }} className="text-xs" style={{ color: "var(--foreground-muted)" }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setReviewing(sub.id)} className="text-sm font-semibold px-4 py-2 rounded-xl"
                        style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                        Review Submission
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
