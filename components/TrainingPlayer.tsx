"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";

interface TrainingPlayerProps {
  lessonId: string;
  driveFileId: string | null;
  notes: string | null;
  isCompleted: boolean;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
  basePath: string;
}

export default function TrainingPlayer({
  lessonId, driveFileId, notes, isCompleted, prevLesson, nextLesson, basePath,
}: TrainingPlayerProps) {
  const [completed, setCompleted] = useState(isCompleted);
  const [marking, setMarking] = useState(false);

  const toggleComplete = async () => {
    setMarking(true);
    const next = !completed;
    setCompleted(next);
    await fetch("/api/training/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, completed: next }),
    });
    setMarking(false);
  };

  return (
    <div>
      {driveFileId ? (
        <div className="rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: "16/9", background: "#000" }}>
          <video
            key={lessonId}
            src={`/api/training/lessons/${lessonId}/video`}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full"
          />
        </div>
      ) : (
        <div
          className="rounded-2xl mb-6 flex items-center justify-center"
          style={{ aspectRatio: "16/9", background: "var(--card-secondary)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>No video for this lesson</p>
        </div>
      )}

      {notes && (
        <div className="card p-5 mb-6">
          <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {prevLesson && (
            <Link
              href={`${basePath}/training/${prevLesson.id}`}
              className="px-4 py-2 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
            >
              <span className="inline-flex items-center gap-1.5"><ArrowLeft size={14} weight="bold" /> Previous</span>
            </Link>
          )}
          {nextLesson && (
            <Link
              href={`${basePath}/training/${nextLesson.id}`}
              className="px-4 py-2 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
            >
              <span className="inline-flex items-center gap-1.5">Next <ArrowRight size={14} weight="bold" /></span>
            </Link>
          )}
        </div>

        <button
          onClick={toggleComplete}
          disabled={marking}
          className={
            "px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2" +
            (completed ? "" : " primary-gradient text-white")
          }
          style={completed ? { background: "var(--success-light)", color: "var(--success)" } : undefined}
        >
          {completed && <CheckCircle size={16} weight="fill" />}
          {completed ? "Watched" : "Mark as watched"}
        </button>
      </div>
    </div>
  );
}
