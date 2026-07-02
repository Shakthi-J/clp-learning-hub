"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnrollmentActions({ id }: { id: string }) {
  const router = useRouter();
  const [acting, setActing] = useState(false);

  const handleAction = async (action: "approve" | "reject") => {
    setActing(true);
    await fetch(`/api/enrollments/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActing(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={() => handleAction("approve")}
        disabled={acting}
        className="px-4 py-2 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60"
      >
        {acting ? "..." : "Approve"}
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={acting}
        className="px-4 py-2 rounded-xl text-sm font-semibold border"
        style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
      >
        {acting ? "..." : "Reject"}
      </button>
    </div>
  );
}