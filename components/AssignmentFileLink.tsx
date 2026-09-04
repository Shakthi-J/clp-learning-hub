"use client";
import { useState } from "react";
import { Paperclip, SpinnerGap } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { signedFileUrl, formatBytes } from "@/lib/assignmentFiles";

/**
 * A signed URL is fetched only when clicked, and only lives 5 minutes - the
 * file itself stays private in storage rather than being linked directly.
 */
export default function AssignmentFileLink({
  path, name, size,
}: {
  path: string;
  name: string;
  size: number | null;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const open = async () => {
    setLoading(true);
    try {
      const url = await signedFileUrl(supabase, path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      alert("Could not open the file. It may have been removed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={open}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
      style={{ background: "var(--card-secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
    >
      {loading ? <SpinnerGap size={15} className="animate-spin" /> : <Paperclip size={15} weight="bold" />}
      <span className="truncate max-w-[220px]">{name}</span>
      {size != null && (
        <span style={{ color: "var(--foreground-muted)" }}>· {formatBytes(size)}</span>
      )}
    </button>
  );
}
