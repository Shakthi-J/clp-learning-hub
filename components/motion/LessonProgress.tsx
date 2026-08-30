"use client";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle } from "@phosphor-icons/react";

const SPRING = { type: "spring" as const, stiffness: 120, damping: 18 };

/**
 * The lesson progress bar and its completion state.
 *
 * Isolated as its own client leaf so the motion runtime only loads on the
 * lesson route, and so a re-render here never touches the player above it.
 */
export default function LessonProgress({
  currentIndex,
  totalLessons,
  completed,
}: {
  currentIndex: number;
  totalLessons: number;
  completed: boolean;
}) {
  const reduce = useReducedMotion();
  const pct = ((currentIndex + (completed ? 1 : 0)) / totalLessons) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
        <span>
          Lesson <span className="font-mono">{currentIndex + 1}</span> of{" "}
          <span className="font-mono">{totalLessons}</span>
        </span>

        <AnimatePresence mode="wait" initial={false}>
          {completed && (
            <motion.span
              key="done"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={reduce ? { duration: 0.15 } : SPRING}
              className="inline-flex items-center gap-1.5 font-medium"
              style={{ color: "var(--success)" }}
            >
              <CheckCircle size={14} weight="fill" />
              Completed
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div
        className="h-1.5 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ background: "var(--border-light)" }}
      >
        {/* A spring rather than a linear tween: the bar arrives with weight,
            which is what makes finishing a lesson feel like an event. */}
        <motion.div
          className="h-full rounded-full"
          style={{ background: completed ? "var(--success)" : "var(--primary)" }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={reduce ? { duration: 0.15 } : SPRING}
        />
      </div>
    </div>
  );
}
