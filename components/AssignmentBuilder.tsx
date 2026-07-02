"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface AssignmentBuilderProps {
  lessonId: string;
}

export default function AssignmentBuilder({ lessonId }: AssignmentBuilderProps) {
  const supabase = createClient();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { fetchAssignment(); }, [lessonId]);

  const fetchAssignment = async () => {
    setLoading(true);
    const { data } = await supabase.from("assignments")
      .select("id, title, prompt").eq("lesson_id", lessonId).maybeSingle();
    if (data) { setAssignment(data); setTitle(data.title); setPrompt(data.prompt); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !prompt.trim()) return;
    setSaving(true); setSuccess(false);
    if (assignment) {
      await supabase.from("assignments").update({ title, prompt }).eq("id", assignment.id);
    } else {
      const { data } = await supabase.from("assignments").insert({ lesson_id: lessonId, title, prompt }).select("id, title, prompt").single();
      setAssignment(data);
    }
    setSaving(false); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDelete = async () => {
    if (!assignment || !confirm("Delete this assignment?")) return;
    await supabase.from("assignments").delete().eq("id", assignment.id);
    setAssignment(null); setTitle(""); setPrompt("");
  };

  if (loading) return <div className="text-xs" style={{ color: "var(--foreground-muted)" }}>Loading assignment...</div>;

  return (
    <div className="card p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <span>📋</span>
        <h4 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Lesson Assignment</h4>
        {assignment && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary-light)", color: "var(--primary)" }}>Active</span>}
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>Assignment Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Gut Health Reflection"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>Prompt / Task for patient</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
            placeholder="e.g. Describe how your current diet may be affecting your gut health based on what you learned in this lesson."
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving || !title || !prompt}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold primary-gradient disabled:opacity-60">
            {saving ? "Saving..." : assignment ? "Update Assignment" : "Create Assignment"}
          </button>
          {assignment && (
            <button onClick={handleDelete} className="text-xs" style={{ color: "var(--danger)" }}>Delete</button>
          )}
          {success && <span className="text-xs" style={{ color: "var(--success)" }}>Saved!</span>}
        </div>
      </div>
    </div>
  );
}
