"use client";
import { use, useState, useEffect } from "react";
import { useStaffBasePath } from "@/lib/useStaffBasePath";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { parseDriveFileId } from "@/lib/driveFileId";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

export default function NewTrainingLessonPage() {
  const base = useStaffBasePath();
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("moduleId") || "";
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [driveInput, setDriveInput] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");

  useEffect(() => {
    if (moduleId) {
      supabase.from("training_modules").select("title").eq("id", moduleId).single()
        .then(({ data }) => { if (data) setModuleTitle(data.title); });
    }
  }, [moduleId]);

  const handleCreate = async () => {
    if (!title || !moduleId) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/training/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, title, drive_file_id: parseDriveFileId(driveInput), notes }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.message || "Failed to create lesson."); return; }
    router.push(`${base}/training`);
    router.refresh();
  };

  return (
    <div className="p-5 sm:p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`${base}/training`} className="text-sm inline-flex items-center gap-1.5" style={{ color: "var(--foreground-secondary)" }}><ArrowLeft size={14} weight="bold" /> Staff Training</Link>
        <span style={{ color: "var(--foreground-muted)" }}>/</span>
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>New Lesson</span>
      </div>

      {moduleTitle && (
        <div className="mb-4 text-sm px-3 py-2 rounded-lg" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
          Adding to module: <strong>{moduleTitle}</strong>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--foreground)" }}>Add New Lesson</h1>

      <div className="space-y-6">
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Lesson Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Adding a new client"
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Google Drive video</label>
          <p className="text-xs mb-3" style={{ color: "var(--foreground-muted)" }}>
            Paste the Drive share link or the file id. Optional - leave blank if there is no recording yet.
          </p>
          <input type="text" value={driveInput} onChange={(e) => setDriveInput(e.target.value)}
            placeholder="https://drive.google.com/file/d/.../view"
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
          {driveInput.trim() && (
            <p className="text-xs mt-2" style={{ color: parseDriveFileId(driveInput) ? "var(--success)" : "var(--danger)" }}>
              {parseDriveFileId(driveInput)
                ? `File id: ${parseDriveFileId(driveInput)}`
                : "That does not look like a Drive link or file id."}
            </p>
          )}
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Lesson Notes</label>
          <p className="text-xs mb-3" style={{ color: "var(--foreground-muted)" }}>
            Use the toolbar to format content. Shown below the video.
          </p>
          <RichTextEditor value={notes} onChange={setNotes} placeholder="Steps, gotchas, or anything worth writing down alongside the recording..." />
        </div>

        {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}

        <div className="flex items-center gap-3">
          <button onClick={handleCreate} disabled={loading || !title || !moduleId}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Saving..." : "Save Lesson"}
          </button>
          <Link href={`${base}/training`} className="px-6 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
