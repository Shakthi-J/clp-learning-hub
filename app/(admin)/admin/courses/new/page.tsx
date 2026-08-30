"use client";
import { useState } from "react";
import { useStaffBasePath } from "@/lib/useStaffBasePath";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCoursePage() {
  const base = useStaffBasePath();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [published, setPublished] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateSlug = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManuallyEdited) setSlug(generateSlug(val));
  };

  const handleCreate = async () => {
    if (!title || !slug) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, description, category, published }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.message || "Failed to create course."); return; }
    router.push(`${base}/courses/${data.id}/lessons`);
    router.refresh();
  };

  const categories = ["Gut Health","Sleep Health","Stress Management","Nutrition","Hormonal Health","Weight Management","Autoimmune","Longevity","Mental Health"];

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`${base}/courses`} className="text-sm inline-flex items-center gap-1.5" style={{ color: "var(--foreground-secondary)" }}><ArrowLeft size={14} weight="bold" /> Courses</Link>
        <span style={{ color: "var(--foreground-muted)" }}>/</span>
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>New Course</span>
      </div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--foreground)" }}>Create New Course</h1>
      <div className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Course Title *</label>
          <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Gut Health Foundations"
            className="w-full px-4 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>URL Slug *</label>
          <p className="text-xs mb-2" style={{ color: "var(--foreground-muted)" }}>Auto-generated from title.</p>
          <div className="flex items-center gap-2">
            <span className="text-sm px-3 py-2.5 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card-secondary)", color: "var(--foreground-muted)" }}>/courses/</span>
            <input type="text" value={slug} onChange={(e) => { setSlugManuallyEdited(true); setSlug(generateSlug(e.target.value)); }}
              placeholder="gut-health-foundations"
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What will patients learn from this course?" rows={4}
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
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Publish Course</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>Visible in the patient catalog when published.</p>
          </div>
          <button onClick={() => setPublished(!published)} className="relative w-12 h-6 rounded-full transition-all flex-shrink-0" style={{ background: published ? "var(--primary)" : "var(--border)" }}>
            <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: published ? "26px" : "4px" }} />
          </button>
        </div>
        {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleCreate} disabled={loading || !title || !slug}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Creating..." : <span className="inline-flex items-center gap-1.5">Create course and add lessons <ArrowRight size={14} weight="bold" /></span>}
          </button>
          <Link href={`${base}/courses`} className="px-6 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
