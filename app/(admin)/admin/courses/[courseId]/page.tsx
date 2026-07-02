"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function EditCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.from("courses").select("*").eq("id", courseId).single().then(({ data }) => {
      if (data) {
        setTitle(data.title);
        setSlug(data.slug);
        setDescription(data.description || "");
        setCategory(data.category || "");
        setPublished(data.published);
      }
      setLoading(false);
    });
  }, [courseId]);

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess(false);
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, description, category, published }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.message || "Failed to save."); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    router.push("/admin/courses");
    router.refresh();
  };

  const categories = ["Gut Health","Sleep Health","Stress Management","Nutrition","Hormonal Health","Weight Management","Autoimmune","Longevity","Mental Health"];

  if (loading) return <div className="p-8 text-sm" style={{ color: "var(--foreground-muted)" }}>Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/courses" className="text-sm" style={{ color: "var(--foreground-secondary)" }}>← Courses</Link>
        <span style={{ color: "var(--foreground-muted)" }}>/</span>
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Edit Course</span>
      </div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Edit Course</h1>
        <Link href={`/admin/courses/${courseId}/lessons`} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
          Manage Lessons →
        </Link>
      </div>
      <div className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Course Title</label>
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
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}>
            <option value="">Select a category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--card-secondary)", border: "1px solid var(--border)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Published</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>Visible in the patient catalog</p>
          </div>
          <button onClick={() => setPublished(!published)} className="relative w-12 h-6 rounded-full transition-all flex-shrink-0" style={{ background: published ? "var(--primary)" : "var(--border)" }}>
            <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: published ? "26px" : "4px" }} />
          </button>
        </div>
        {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
        {success && <p className="text-xs" style={{ color: "var(--success)" }}>Saved successfully.</p>}
        <div className="flex items-center justify-between pt-2">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={handleDelete} className="text-xs" style={{ color: "var(--danger)" }}>Delete Course</button>
        </div>
      </div>
    </div>
  );
}
