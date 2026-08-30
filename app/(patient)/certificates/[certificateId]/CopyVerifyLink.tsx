"use client";
import { useState } from "react";

export default function CopyVerifyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      onClick={copy}
      className="text-sm font-semibold px-4 py-2 rounded-xl border"
      style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)", background: "var(--card)" }}
    >
      {copied ? "Link copied" : "Copy verify link"}
    </button>
  );
}
