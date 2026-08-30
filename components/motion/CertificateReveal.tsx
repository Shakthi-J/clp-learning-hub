"use client";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SealCheck } from "@phosphor-icons/react";

/**
 * Wraps the certificate document so it settles into place on first view, with
 * the verification seal stamping on afterwards.
 *
 * Deliberately a one-shot: this is a moment, not an ambient animation. It also
 * carries `print:` resets so the reveal never affects the printed PDF.
 */
export default function CertificateReveal({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={
          reduce
            ? { duration: 0.2 }
            : { type: "spring", stiffness: 90, damping: 17, mass: 0.9 }
        }
        style={{ transformOrigin: "center top" }}
      >
        {children}
      </motion.div>

      {/* The seal lands after the document has settled. */}
      <motion.div
        aria-hidden="true"
        className="print-hidden absolute -top-3 -right-3 md:-top-4 md:-right-4 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center"
        style={{
          background: "var(--card)",
          color: "var(--success)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3, rotate: -30 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={
          reduce
            ? { duration: 0.2, delay: 0.1 }
            : { type: "spring", stiffness: 220, damping: 13, delay: 0.45 }
        }
      >
        <SealCheck size={28} weight="duotone" />
      </motion.div>
    </div>
  );
}
