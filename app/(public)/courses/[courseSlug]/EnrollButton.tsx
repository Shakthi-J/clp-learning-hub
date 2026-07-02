"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function EnrollButton({ courseId, isLoggedIn }: { courseId: string; isLoggedIn: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const handleRequest = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    setLoading(true); setMessage(null);
    const res = await fetch("/api/enrollments/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId }) });
    const data = await res.json();
    setLoading(false);
    if (res.ok) { setMessage({ type: "success", text: "Enrollment request sent! You will hear from us soon." }); }
    else { setMessage({ type: data.code === "ACTIVE_ENROLLMENT" ? "info" : "error", text: data.message || "Something went wrong." }); }
  };
  return (
    <div className="flex flex-col gap-3">
      <button onClick={handleRequest} disabled={loading || message?.type === "success"}
        className="px-6 py-3 rounded-xl text-white font-semibold text-sm primary-gradient disabled:opacity-60 disabled:cursor-not-allowed">
        {loading ? "Requesting..." : message?.type === "success" ? "Request Sent" : isLoggedIn ? "Request Enrollment" : "Sign In to Enroll"}
      </button>
      {message && <p className="text-xs text-center px-2" style={{ color: message.type === "success" ? "var(--success)" : message.type === "info" ? "var(--warning)" : "var(--danger)" }}>{message.text}</p>}
    </div>
  );
}
