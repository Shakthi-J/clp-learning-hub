"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Certificate, ArrowRight, X } from "@phosphor-icons/react";

/**
 * Shown once, when the final lesson of a course is marked complete.
 *
 * The progress API issues the certificate at that moment and returns its id,
 * so this is the one place the app can tell someone they finished. Without it
 * a course ends silently.
 */
export default function CourseCompleteDialog({
  open,
  certificateId,
  courseSlug,
  onClose,
}: {
  open: boolean;
  certificateId: string | null;
  courseSlug: string;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog, and let Escape dismiss it.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ background: "color-mix(in srgb, var(--foreground) 45%, transparent)" }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-complete-title"
        >
          <motion.div
            className="card relative w-full max-w-sm p-8 text-center"
            style={{ boxShadow: "var(--shadow-lg)" }}
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 140, damping: 18 }}
          >
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 rounded-lg p-1"
              style={{ color: "var(--foreground-muted)" }}
            >
              <X size={16} weight="bold" />
            </button>

            {/* The seal settles into place rather than appearing. */}
            <motion.div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5"
              style={{ background: "var(--accent-amber-light)", color: "var(--accent-amber)" }}
              initial={reduce ? false : { scale: 0.4, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
            >
              <Certificate size={30} weight="duotone" />
            </motion.div>

            <h2
              id="course-complete-title"
              className="text-xl font-semibold tracking-tight mb-2"
              style={{ color: "var(--foreground)" }}
            >
              Course complete
            </h2>
            <p className="text-sm leading-relaxed mb-7" style={{ color: "var(--foreground-secondary)" }}>
              You worked through every lesson. Your certificate has been issued and is ready
              whenever you want it.
            </p>

            <div className="flex flex-col gap-2">
              {certificateId ? (
                <Link
                  href={`/certificates/${certificateId}`}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl"
                  style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                >
                  View your certificate <ArrowRight size={14} weight="bold" />
                </Link>
              ) : (
                <Link
                  href="/certificates"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl"
                  style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                >
                  Go to certificates <ArrowRight size={14} weight="bold" />
                </Link>
              )}
              <Link
                href={`/learn/${courseSlug}`}
                className="text-sm font-semibold px-4 py-2.5 rounded-xl"
                style={{ color: "var(--foreground-secondary)" }}
              >
                Back to the course
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
