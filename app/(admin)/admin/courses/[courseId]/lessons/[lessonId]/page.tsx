"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

export default function EditLessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { courseId, lessonId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const extractYoutubeId = (input: string) => {
    const urlMatch = input.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (urlMatch) return urlMatch[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
    return input;
  };

  useEffect(() => {
    supabase.from("lessons").select("*").eq("id", lessonId).single().then(({ data }) => {
      if (data) {
        setTitle(data.title);
        setSlug(data.slug);
        setYoutubeId(data.youtube_video_id || "");
        setNotes(data.notes || "");
      }
      setLoading(false);
    });
  }, [lessonId]);

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess(false);
    const res = await fetch(`/api/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, youtube_video_id: extractYoutubeId(youtubeId), notes }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.message || "Failed to save."); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const videoPreviewId = youtubeId ? extractYoutubeId(youtubeId) : "";

  if (loading) return <div className="p-8 text-sm" style={{ color: "var(--foreground-muted)" }}>Loading...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/courses" className="text-sm" style={{ color: "var(--foreground-secondary)" }}>← Courses</Link>
        <span style={{ color: "var(--foreground-muted)" }}>/</span>
        <Link href={`/admin/courses/${courseId}/lessons`} className="text-sm" style={{ color: "var(--foreground-secondary)" }}>Lessons</Link>
        <span style={{ color: "var(--foreground-muted)" }}>/</span>
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Edit Lesson</span>
      </div>

      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--foreground)" }}>Edit Lesson</h1>

      <div className="space-y-6">
        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Lesson Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>URL Slug</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
          </div>
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>YouTube Video</label>
          <p className="text-xs mb-3" style={{ color: "var(--foreground-muted)" }}>Paste the full YouTube URL or just the video ID.</p>
          <input type="text" value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or video ID"
            className="w-full px-4 py-2.5 rounded-xl border text-sm mb-4"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
          {videoPreviewId && videoPreviewId.length >= 10 && (
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", background: "#000" }}>
              <iframe src={`https://www.youtube.com/embed/${videoPreviewId}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen />
            </div>
          )}
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Lesson Notes</label>
          <p className="text-xs mb-3" style={{ color: "var(--foreground-muted)" }}>Patients will see this below the video.</p>
          <RichTextEditor value={notes} onChange={setNotes} placeholder="Type your lesson notes here..." />
        </div>

        {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
        {success && <p className="text-xs" style={{ color: "var(--success)" }}>Saved successfully.</p>}

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link href={`/admin/courses/${courseId}/lessons`} className="px-6 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}>
            Back to Lessons
          </Link>
        </div>
      </div>
    </div>
  );
}
