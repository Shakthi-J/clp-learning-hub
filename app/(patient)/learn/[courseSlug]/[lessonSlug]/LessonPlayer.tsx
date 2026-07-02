"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LessonPlayerProps {
  lessonId: string;
  enrollmentId: string;
  youtubeVideoId: string | null;
  notes: string | null;
  isCompleted: boolean;
  prevLesson: { slug: string; title: string } | null;
  nextLesson: { slug: string; title: string } | null;
  courseSlug: string;
  totalLessons: number;
  currentIndex: number;
}

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}

export default function LessonPlayer({
  lessonId, enrollmentId, youtubeVideoId, notes, isCompleted,
  prevLesson, nextLesson, courseSlug, totalLessons, currentIndex,
}: LessonPlayerProps) {
  const router = useRouter();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [completed, setCompleted] = useState(isCompleted);
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    setCompleted(isCompleted);
    setMarked(false);
  }, [lessonId, isCompleted]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!youtubeVideoId) return;

    const initPlayer = () => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: youtubeVideoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event: any) => {
            // Auto mark complete when video ends
            if (event.data === window.YT.PlayerState.ENDED) {
              handleMarkComplete();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.getElementById("yt-api-script")) {
        const script = document.createElement("script");
        script.id = "yt-api-script";
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy();
    };
  }, [youtubeVideoId, lessonId]);

  const handleMarkComplete = async () => {
    if (completed || marking || marked) return;
    setMarking(true);
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, lessonId }),
      });
      setCompleted(true);
      setMarked(true);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div>
      {/* Video player */}
      {youtubeVideoId ? (
        <div className="rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: "16/9", background: "#000" }}>
          <div ref={containerRef} className="w-full h-full" />
        </div>
      ) : (
        <div className="rounded-2xl mb-6 flex items-center justify-center" style={{ aspectRatio: "16/9", background: "var(--card-secondary)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>No video for this lesson</p>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-1" style={{ color: "var(--foreground-muted)" }}>
          <span>Lesson {currentIndex + 1} of {totalLessons}</span>
          {completed && <span style={{ color: "var(--success)" }}>Completed</span>}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full" style={{ width: `${((currentIndex + (completed ? 1 : 0)) / totalLessons) * 100}%`, background: "var(--primary)", transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-3">
          {prevLesson && (
            <Link href={`/learn/${courseSlug}/${prevLesson.slug}`}
              className="px-4 py-2 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}>
              ← Previous
            </Link>
          )}
          {nextLesson && (
            <Link href={`/learn/${courseSlug}/${nextLesson.slug}`}
              className="px-4 py-2 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}>
              Next →
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!completed && (
            <button onClick={handleMarkComplete} disabled={marking}
              className="px-5 py-2 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60">
              {marking ? "Saving..." : "Mark as Complete"}
            </button>
          )}
          {completed && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
              <span>✓</span>
              <span>Completed</span>
            </div>
          )}
          {completed && nextLesson && (
            <Link href={`/learn/${courseSlug}/${nextLesson.slug}`}
              className="px-5 py-2 rounded-xl text-white text-sm font-semibold primary-gradient">
              Next Lesson →
            </Link>
          )}
          {completed && !nextLesson && (
            <Link href={`/learn/${courseSlug}`}
              className="px-5 py-2 rounded-xl text-white text-sm font-semibold primary-gradient">
              Course Complete →
            </Link>
          )}
        </div>
      </div>

      {/* Lesson notes */}
      {notes && (
        <div className="card p-6">
          <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Lesson Notes</h2>
          <div
            className="prose-content text-sm leading-relaxed"
            style={{ color: "var(--foreground-secondary)" }}
            dangerouslySetInnerHTML={{ __html: notes }}
          />
        </div>
      )}

      <style>{`
        .prose-content h2 { font-size: 17px; font-weight: 700; margin: 16px 0 8px; color: var(--foreground); }
        .prose-content h3 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; color: var(--foreground); }
        .prose-content p { margin: 6px 0; }
        .prose-content ul { padding-left: 20px; list-style-type: disc; margin: 8px 0; }
        .prose-content ol { padding-left: 20px; list-style-type: decimal; margin: 8px 0; }
        .prose-content li { margin: 4px 0; }
        .prose-content strong { font-weight: 700; color: var(--foreground); }
        .prose-content em { font-style: italic; }
        .prose-content hr { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
      `}</style>
    </div>
  );
}
