"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useStaffBasePath } from "@/lib/useStaffBasePath";
import { createClient } from "@/lib/supabase/client";
import { parseDriveFileId } from "@/lib/driveFileId";
import {
  ChalkboardTeacher, Plus, Stack, PlayCircle, CaretDown, CaretRight, Trash, CheckCircle, PencilSimple,
} from "@phosphor-icons/react";

type Lesson = { id: string; title: string; order: number; drive_file_id: string | null };
type Module = { id: string; title: string; order: number; lessons: Lesson[] };

export default function TrainingPage() {
  const base = useStaffBasePath();
  const supabase = createClient();

  const [modules, setModules] = useState<Module[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [showModuleForm, setShowModuleForm] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);

  // Which module's "add lesson" form is open.
  const [lessonFormFor, setLessonFormFor] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonVideo, setNewLessonVideo] = useState("");
  const [addingLesson, setAddingLesson] = useState(false);

  // Which existing lesson is being edited - the only way to attach a video
  // to a lesson that was created before its Drive upload had finished.
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editVideo, setEditVideo] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete asks for a second click rather than a native confirm() dialog -
  // some browsers and embedded webviews block or auto-dismiss those, which
  // looks indistinguishable from the button doing nothing. Arming resets on
  // its own after a few seconds so a stray click cannot delete anything.
  const [armedForDelete, setArmedForDelete] = useState<string | null>(null);
  const askToDelete = (id: string) => {
    if (armedForDelete === id) {
      setArmedForDelete(null);
      return true;
    }
    setArmedForDelete(id);
    setTimeout(() => setArmedForDelete((current) => (current === id ? null : current)), 4000);
    return false;
  };

  const fetchData = async () => {
    const { data: mods } = await supabase
      .from("training_modules")
      .select("id, title, order, training_lessons(id, title, order, drive_file_id)")
      .order("order");

    const sorted = (mods || []).map((m: any) => ({
      ...m,
      lessons: (m.training_lessons || []).sort((a: any, b: any) => a.order - b.order),
    }));
    setModules(sorted);
    setExpanded(new Set(sorted.map((m) => m.id)));

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: patient } = await supabase.from("patients").select("id").eq("auth_user_id", user.id).maybeSingle();
      if (patient) {
        const { data: progress } = await supabase.from("training_progress").select("lesson_id").eq("patient_id", patient.id);
        setCompletedIds(new Set((progress || []).map((p: any) => p.lesson_id)));
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    await fetch("/api/training/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newModuleTitle }),
    });
    setNewModuleTitle("");
    setShowModuleForm(false);
    setAddingModule(false);
    fetchData();
  };

  const handleDeleteModule = async (id: string) => {
    if (!askToDelete("module:" + id)) return;
    await fetch(`/api/training/modules/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return;
    setAddingLesson(true);
    await fetch("/api/training/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId,
        title: newLessonTitle,
        drive_file_id: parseDriveFileId(newLessonVideo),
      }),
    });
    setNewLessonTitle("");
    setNewLessonVideo("");
    setLessonFormFor(null);
    setAddingLesson(false);
    fetchData();
  };

  const handleDeleteLesson = async (id: string) => {
    if (!askToDelete("lesson:" + id)) return;
    await fetch(`/api/training/lessons/${id}`, { method: "DELETE" });
    fetchData();
  };

  const startEditingLesson = (lesson: Lesson) => {
    setEditingLesson(lesson.id);
    setEditTitle(lesson.title);
    // Shown as the bare id - a staff member replacing it can paste either a
    // fresh id or a full Drive link, since parseDriveFileId accepts both.
    setEditVideo(lesson.drive_file_id ?? "");
  };

  const handleSaveLesson = async (id: string) => {
    if (!editTitle.trim()) return;
    setSavingEdit(true);
    await fetch(`/api/training/lessons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim(),
        drive_file_id: parseDriveFileId(editVideo),
      }),
    });
    setSavingEdit(false);
    setEditingLesson(null);
    fetchData();
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalDone = modules.reduce((acc, m) => acc + m.lessons.filter((l) => completedIds.has(l.id)).length, 0);

  if (loading) {
    return <div className="p-5 sm:p-8"><div className="skeleton h-8 w-64 rounded-lg" /></div>;
  }

  return (
    <div className="p-5 sm:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: "var(--foreground)" }}>
          <ChalkboardTeacher size={24} weight="duotone" />
          Staff Training
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
          How the team uses our own tools. Visible to admins and instructors only - patients never see this.
        </p>
        {totalLessons > 0 && (
          <p className="text-xs mt-2 font-semibold" style={{ color: "var(--primary)" }}>
            {totalDone} of {totalLessons} lessons watched
          </p>
        )}
      </div>

      <div className="space-y-4">
        {modules.map((mod) => {
          const isOpen = expanded.has(mod.id);
          return (
            <div key={mod.id} className="card overflow-hidden">
              {/* Two sibling buttons, not one nested in the other - a button
                  inside a button is invalid HTML and browsers deliver its
                  clicks inconsistently, which is exactly the kind of thing
                  that looks like "delete does nothing" without ever erroring. */}
              <div className="w-full flex items-center justify-between gap-3 p-4">
                <button
                  onClick={() => toggleExpanded(mod.id)}
                  className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                >
                  {isOpen ? <CaretDown size={16} /> : <CaretRight size={16} />}
                  <Stack size={16} weight="duotone" style={{ color: "var(--foreground-muted)" }} />
                  <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{mod.title}</span>
                  <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteModule(mod.id)}
                  className="text-xs font-semibold flex-shrink-0 px-1.5 py-1 rounded-lg"
                  style={
                    armedForDelete === "module:" + mod.id
                      ? { background: "var(--danger-light)", color: "var(--danger)" }
                      : { color: "var(--danger)" }
                  }
                >
                  {armedForDelete === "module:" + mod.id
                    ? <span className="inline-flex items-center gap-1"><Trash size={15} /> Confirm?</span>
                    : <Trash size={15} />}
                </button>
              </div>

              {isOpen && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {mod.lessons.map((lesson) =>
                    editingLesson === lesson.id ? (
                      <div
                        key={lesson.id}
                        className="px-4 py-3"
                        style={{ borderBottom: "1px solid var(--border-light, var(--border))", background: "var(--card-secondary)" }}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Lesson title"
                          className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
                          style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
                        />
                        <input
                          type="text"
                          value={editVideo}
                          onChange={(e) => setEditVideo(e.target.value)}
                          placeholder="Drive video link or file id (leave blank to remove)"
                          className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
                          style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveLesson(lesson.id)}
                            disabled={savingEdit || !editTitle.trim()}
                            className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold primary-gradient disabled:opacity-60"
                          >
                            {savingEdit ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingLesson(null)}
                            className="px-3 py-1.5 rounded-lg text-xs border"
                            style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                        style={{ borderBottom: "1px solid var(--border-light, var(--border))" }}
                      >
                        <Link href={`${base}/training/${lesson.id}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                          {completedIds.has(lesson.id) ? (
                            <CheckCircle size={16} weight="fill" style={{ color: "var(--success)" }} />
                          ) : (
                            <PlayCircle size={16} style={{ color: "var(--foreground-muted)" }} />
                          )}
                          <span className="text-sm truncate" style={{ color: "var(--foreground)" }}>{lesson.title}</span>
                          {!lesson.drive_file_id && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "var(--card-secondary)", color: "var(--foreground-muted)" }}>
                              No video
                            </span>
                          )}
                        </Link>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEditingLesson(lesson)}
                            className="p-1.5 rounded-lg"
                            style={{ color: "var(--foreground-muted)" }}
                            aria-label="Edit lesson"
                          >
                            <PencilSimple size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-xs font-semibold px-1.5 py-1 rounded-lg"
                            style={
                              armedForDelete === "lesson:" + lesson.id
                                ? { background: "var(--danger-light)", color: "var(--danger)" }
                                : { color: "var(--danger)" }
                            }
                          >
                            {armedForDelete === "lesson:" + lesson.id
                              ? <span className="inline-flex items-center gap-1"><Trash size={14} /> Confirm?</span>
                              : <Trash size={14} />}
                          </button>
                        </div>
                      </div>
                    )
                  )}

                  <div className="p-3">
                    {lessonFormFor === mod.id ? (
                      <div className="rounded-xl p-3" style={{ background: "var(--card-secondary)" }}>
                        <input
                          type="text"
                          value={newLessonTitle}
                          onChange={(e) => setNewLessonTitle(e.target.value)}
                          placeholder="Lesson title"
                          className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
                          style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
                        />
                        <input
                          type="text"
                          value={newLessonVideo}
                          onChange={(e) => setNewLessonVideo(e.target.value)}
                          placeholder="Drive video link or file id (optional)"
                          className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
                          style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddLesson(mod.id)}
                            disabled={addingLesson || !newLessonTitle.trim()}
                            className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold primary-gradient disabled:opacity-60"
                          >
                            {addingLesson ? "Adding..." : "Add Lesson"}
                          </button>
                          <button
                            onClick={() => setLessonFormFor(null)}
                            className="px-3 py-1.5 rounded-lg text-xs border"
                            style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setLessonFormFor(mod.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: "var(--primary)" }}
                      >
                        <Plus size={13} weight="bold" /> Add lesson
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        {showModuleForm ? (
          <div className="card p-4">
            <input
              type="text"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Module title, e.g. Using Calendly"
              className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
              style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddModule}
                disabled={addingModule || !newModuleTitle.trim()}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold primary-gradient disabled:opacity-60"
              >
                {addingModule ? "Adding..." : "Add Module"}
              </button>
              <button
                onClick={() => setShowModuleForm(false)}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowModuleForm(true)}
            className="w-full py-3 rounded-xl text-sm font-semibold border-2 border-dashed"
            style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
          >
            <span className="inline-flex items-center gap-1.5"><Plus size={14} weight="bold" /> Add module</span>
          </button>
        )}
      </div>
    </div>
  );
}
