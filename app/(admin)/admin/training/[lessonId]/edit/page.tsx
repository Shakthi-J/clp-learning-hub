"use client";
import { use, useState, useEffect } from "react";
import { useStaffBasePath } from "@/lib/useStaffBasePath";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { parseDriveFileId } from "@/lib/driveFileId";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

export default function EditTrainingLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const base = useStaffBasePath();
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [driveInput, setDriveInput] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.from("training_lessons").select("*").eq("id", lessonId).single().then(({ data }) => {
      if (data) {
        setTitle(data.title);
        setDriveInput(data.drive_file_id || "");
        setNotes(data.notes || "");
      }
      setLoading(false);
    });
  }, [lessonId]);

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess(false);
    const res = await fetch(`/api/training/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, drive_file_id: parseDriveFileId(driveInput), notes }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.message || "Failed to save."); return; }
    setSuccess(true); setTimeout(() => setSuccess(false), 3000);
  };

  if (loading) return <div className="p-8 text-sm" style={{ color: "var(--foreground-muted)" }}>Loading...</div>;

  return (
    <div className="p-5 sm:p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`${base}/training`} className="text-sm inline-flex items-center gap-1.5" style={{ color: "var(--foreground-secondary)" }}><ArrowLeft size={14} weight="bold" /> Staff Training</Link>
        <span style={{ color: "var(--foreground-muted)" }}>/</span>
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Edit Lesson</span>
      </div>

      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--foreground)" }}>Edit Lesson</h1>

      <div className="space-y-6">
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Lesson Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Google Drive video</label>
          <p className="text-xs mb-3" style={{ color: "var(--foreground-muted)" }}>
            Paste the Drive share link or the file id. Clear this field to remove the attached video.
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
        {success && <p className="text-xs" style={{ color: "var(--success)" }}>Saved.</p>}

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving || !title}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link href={`${base}/training`} className="px-6 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}>
            Back to Training
          </Link>
        </div>
      </div>
    </div>
  );
}
