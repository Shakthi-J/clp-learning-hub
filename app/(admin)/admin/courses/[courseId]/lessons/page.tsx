"use client";
import { use, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Lesson = { id: string; title: string; slug: string; order: number; youtube_video_id: string };
type Module = { id: string; title: string; order: number; lessons: Lesson[] };

export default function LessonsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const supabase = createClient();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);

  const fetchData = async () => {
    const { data: courseData } = await supabase.from("courses").select("id, title, published").eq("id", courseId).single();
    setCourse(courseData);
    const { data: modulesData } = await supabase
      .from("modules")
      .select("id, title, order, lessons(id, title, slug, order, youtube_video_id)")
      .eq("course_id", courseId)
      .order("order");
    const sorted = (modulesData || []).map((m: any) => ({
      ...m,
      lessons: (m.lessons || []).sort((a: any, b: any) => a.order - b.order),
    }));
    setModules(sorted);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [courseId]);

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    await supabase.from("modules").insert({ course_id: courseId, title: newModuleTitle.trim(), order: modules.length + 1 });
    setNewModuleTitle("");
    setAddingModule(false);
    fetchData();
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module and all its lessons?")) return;
    await supabase.from("modules").delete().eq("id", moduleId);
    fetchData();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;
    await supabase.from("lessons").delete().eq("id", lessonId);
    fetchData();
  };

  if (loading) return <div className="p-8 text-sm" style={{ color: "var(--foreground-muted)" }}>Loading...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/courses" className="text-sm" style={{ color: "var(--foreground-secondary)" }}>← Courses</Link>
        <span style={{ color: "var(--foreground-muted)" }}>/</span>
        <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{course?.title}</span>
      </div>
      <div className="flex items-center justify-between mb-8 mt-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Lessons</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>Add modules and lessons to this course</p>
        </div>
        <Link href={`/admin/courses/${courseId}`} className="px-4 py-2 rounded-xl text-sm font-semibold border" style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}>
          Edit Course Details
        </Link>
      </div>

      <div className="space-y-4 mb-6">
        {modules.map((mod, mi) => (
          <div key={mod.id} className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)", background: "var(--card-secondary)" }}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{mi + 1}</div>
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{mod.title}</span>
                <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/courses/${courseId}/lessons/new?moduleId=${mod.id}`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                  + Add Lesson
                </Link>
                <button onClick={() => handleDeleteModule(mod.id)} className="text-xs px-2 py-1.5 rounded-lg" style={{ color: "var(--danger)" }}>Delete</button>
              </div>
            </div>
            {mod.lessons.length > 0 ? (
              <div>
                {mod.lessons.map((lesson, li) => (
                  <div key={lesson.id} className="flex items-center justify-between px-5 py-3 border-b last:border-b-0" style={{ borderColor: "var(--border-light)" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs flex-shrink-0" style={{ color: "var(--foreground-muted)" }}>{li + 1}</span>
                      <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{lesson.title}</span>
                      {lesson.youtube_video_id && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "#fef2f2", color: "#dc2626" }}>▶ Video</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/admin/courses/${courseId}/lessons/${lesson.id}`} className="text-xs font-semibold" style={{ color: "var(--primary)" }}>Edit</Link>
                      <button onClick={() => handleDeleteLesson(lesson.id)} className="text-xs" style={{ color: "var(--danger)" }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-4 text-sm" style={{ color: "var(--foreground-muted)" }}>No lessons yet. Click &quot;+ Add Lesson&quot; to add one.</div>
            )}
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>+ Add New Module</h3>
        <div className="flex gap-3">
          <input type="text" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
            placeholder="e.g. Introduction to the Gut Microbiome"
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
          <button onClick={handleAddModule} disabled={addingModule || !newModuleTitle.trim()}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60">
            {addingModule ? "Adding..." : "Add Module"}
          </button>
        </div>
      </div>
    </div>
  );
}
