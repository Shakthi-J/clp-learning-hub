"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IssueCertificateButton({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issue = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/certificates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.message || "Could not issue certificate");
      return;
    }
    router.push(`/certificates/${data.certificateId}`);
  };

  return (
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <button
        onClick={issue}
        disabled={loading}
        className="text-sm font-semibold px-4 py-2 rounded-xl  disabled:opacity-60"
        style={{ background: "var(--primary)", color: "var(--on-primary)" }}
      >
        {loading ? "Issuing…" : "Issue Certificate"}
      </button>
      {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
