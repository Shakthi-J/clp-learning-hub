"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type Comment = {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  patient_id: string;
  patients: { name: string | null; role: string | null } | null;
};

function initials(name: string | null) {
  return (name || "P")[0].toUpperCase();
}

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function LessonDiscussion({
  lessonId,
  comments,
  currentPatientId,
  canModerate,
}: {
  lessonId: string;
  comments: Comment[];
  currentPatientId: string;
  canModerate: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roots = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  const post = async (text: string, parentId: string | null) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, body: trimmed, parentId }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Could not post");
      return;
    }
    setBody("");
    setReplyBody("");
    setReplyTo(null);
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    setBusy(true);
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isStaff = comment.patients?.role === "admin" || comment.patients?.role === "instructor";
    const canDelete = comment.patient_id === currentPatientId || canModerate;

    return (
      <div key={comment.id} className={isReply ? "pl-6 md:pl-11" : ""}>
        <div className="flex gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{
              background: comment.patients?.role === "admin"
                ? "var(--accent-indigo)"
                : comment.patients?.role === "instructor"
                  ? "var(--accent-teal)"
                  : "var(--accent-blue-light)",
              color: isStaff ? "#fff" : "var(--accent-blue)",
            }}
          >
            {initials(comment.patients?.name ?? null)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {comment.patients?.name || "Learner"}
              </span>
              {isStaff && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={comment.patients?.role === "admin"
                    ? { background: "var(--accent-indigo-light)", color: "var(--accent-indigo)" }
                    : { background: "var(--accent-teal-light)", color: "var(--accent-teal)" }}
                >
                  {comment.patients?.role === "admin" ? "CLP Team" : "Instructor"}
                </span>
              )}
              <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                {timeAgo(comment.created_at)}
              </span>
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: "var(--foreground-secondary)" }}>
              {comment.body}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {!isReply && (
                <button
                  onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyBody(""); }}
                  className="text-xs font-semibold"
                  style={{ color: "var(--primary)" }}
                >
                  Reply
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => remove(comment.id)}
                  disabled={busy}
                  className="text-xs"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  Delete
                </button>
              )}
            </div>

            {replyTo === comment.id && (
              <div className="mt-3">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write a reply…"
                  rows={2}
                  maxLength={4000}
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => post(replyBody, comment.id)}
                    disabled={busy || !replyBody.trim()}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg  disabled:opacity-60"
                    style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                  >
                    {busy ? "Posting…" : "Reply"}
                  </button>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {repliesOf(comment.id).length > 0 && (
          <div className="mt-4 space-y-4">
            {repliesOf(comment.id).map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card p-6">
      <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>
        Discussion {comments.length > 0 && (
          <span className="text-sm font-normal" style={{ color: "var(--foreground-muted)" }}>
            ({comments.length})
          </span>
        )}
      </h2>

      <div className="mb-6">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ask a question about this lesson…"
          rows={3}
          maxLength={4000}
          className="w-full px-4 py-2.5 rounded-xl border text-sm"
          style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}
        />
        {error && <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>{error}</p>}
        <button
          onClick={() => post(body, null)}
          disabled={busy || !body.trim()}
          className="mt-3 text-sm font-semibold px-4 py-2 rounded-xl  disabled:opacity-60"
          style={{ background: "var(--primary)", color: "var(--on-primary)" }}
        >
          {busy ? "Posting…" : "Post question"}
        </button>
      </div>

      {roots.length > 0 ? (
        <div className="space-y-6">{roots.map((comment) => renderComment(comment))}</div>
      ) : (
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          No questions yet. Start the conversation.
        </p>
      )}
    </div>
  );
}
