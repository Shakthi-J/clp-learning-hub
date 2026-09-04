"use client";
import { useRef, useState } from "react";
import { ClipboardText, Paperclip, X } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { describeFileError, uploadAssignmentFile, formatBytes } from "@/lib/assignmentFiles";
import AssignmentFileLink from "./AssignmentFileLink";

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
    file_path: string | null;
    file_name: string | null;
    file_size: number | null;
  } | null;
}

export default function AssignmentBlock({
  assignmentId, enrollmentId, title, prompt, existingSubmission,
}: AssignmentBlockProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [response, setResponse] = useState(existingSubmission?.response || "");
  const [submission, setSubmission] = useState(existingSubmission);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(!existingSubmission);
  const [error, setError] = useState("");

  // A newly chosen file that hasn't been uploaded yet, versus the file
  // already attached to a saved submission.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  const currentFile =
    !removeExistingFile && submission?.file_path
      ? { path: submission.file_path, name: submission.file_name!, size: submission.file_size }
      : null;

  const handleChooseFile = (file: File | null) => {
    setError("");
    if (!file) { setPendingFile(null); return; }
    const problem = describeFileError(file);
    if (problem) { setError(problem); return; }
    setPendingFile(file);
    setRemoveExistingFile(false);
  };

  const handleSubmit = async () => {
    if (!response.trim()) return;
    setLoading(true);
    setError("");

    try {
      let fileFields: { file_path?: string | null; file_name?: string | null; file_size?: number | null } = {};

      if (pendingFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Signed out");
        const uploaded = await uploadAssignmentFile(supabase, user.id, assignmentId, pendingFile);
        fileFields = { file_path: uploaded.path, file_name: uploaded.name, file_size: uploaded.size };
      } else if (removeExistingFile) {
        fileFields = { file_path: null, file_name: null, file_size: null };
      }

      const res = await fetch("/api/assignments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, enrollmentId, response, ...fileFields }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to submit."); return; }

      setSubmission(data.submission);
      setPendingFile(null);
      setRemoveExistingFile(false);
      setEditing(false);
    } catch (e: any) {
      setError(e?.message === "Signed out" ? "You have been signed out - sign in again." : "Could not upload the file.");
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = (status: string) => {
    if (status === "approved") return { background: "var(--success-light)", color: "var(--success)" };
    if (status === "needs_revision") return { background: "var(--danger-light)", color: "var(--danger)" };
    return { background: "var(--beige-light)", color: "var(--foreground-secondary)" };
  };

  const statusLabel = (status: string) => {
    if (status === "approved") return "Approved";
    if (status === "needs_revision") return "Needs Revision";
    return "Under Review";
  };

  return (
    <div className="card p-6 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardText size={18} weight="duotone" />
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
          {submission.file_path && submission.file_name && (
            <div className="mb-3">
              <AssignmentFileLink path={submission.file_path} name={submission.file_name} size={submission.file_size} />
            </div>
          )}
          {submission.feedback && (
            <div className="rounded-xl p-4 mb-3" style={{ background: "var(--warning-light)", border: "1px solid var(--warning-light)" }}>
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

          <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
            Attachment <span className="font-normal" style={{ color: "var(--foreground-muted)" }}>(optional)</span>
          </label>

          {pendingFile ? (
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--primary-light)", color: "var(--primary)" }}
              >
                <Paperclip size={15} weight="bold" />
                <span className="truncate max-w-[220px]">{pendingFile.name}</span>
                <span>· {formatBytes(pendingFile.size)}</span>
              </span>
              <button onClick={() => handleChooseFile(null)} aria-label="Remove file" style={{ color: "var(--foreground-muted)" }}>
                <X size={16} weight="bold" />
              </button>
            </div>
          ) : currentFile ? (
            <div className="flex items-center gap-2 mb-3">
              <AssignmentFileLink path={currentFile.path} name={currentFile.name} size={currentFile.size} />
              <button
                onClick={() => setRemoveExistingFile(true)}
                className="text-xs font-semibold"
                style={{ color: "var(--danger)" }}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-3"
              style={{ background: "var(--card-secondary)", border: "1px dashed var(--border)", color: "var(--foreground-secondary)" }}
            >
              <Paperclip size={15} weight="bold" />
              Attach a file
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => handleChooseFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs mb-3" style={{ color: "var(--foreground-muted)" }}>
            PDF, Word, or an image. Up to 20 MB.
          </p>

          {error && <p className="text-xs mb-2" style={{ color: "var(--danger)" }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={loading || !response.trim()}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60">
              {loading ? "Submitting..." : "Submit Assignment"}
            </button>
            {submission && (
              <button onClick={() => { setEditing(false); setPendingFile(null); setRemoveExistingFile(false); }}
                className="px-4 py-2 rounded-xl text-sm border"
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
