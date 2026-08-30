"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import StarRating, { Stars } from "./StarRating";

export type Review = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  patients: { name: string | null } | null;
};

export default function CourseReviews({
  courseId,
  reviews,
  avgRating,
  reviewCount,
  canReview,
  myReview,
}: {
  courseId: string;
  reviews: Review[];
  avgRating: number;
  reviewCount: number;
  canReview: boolean;
  myReview: { rating: number; body: string | null } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [body, setBody] = useState(myReview?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (rating < 1) {
      setError("Pick a star rating first");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, rating, body }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Could not save your review");
      return;
    }
    setOpen(false);
    router.refresh();
  };

  const remove = async () => {
    if (!confirm("Delete your review?")) return;
    setSaving(true);
    await fetch(`/api/reviews?courseId=${courseId}`, { method: "DELETE" });
    setSaving(false);
    setRating(0);
    setBody("");
    setOpen(false);
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Reviews</h2>
          {reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <Stars value={avgRating} />
              <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                ({reviewCount})
              </span>
            </div>
          )}
        </div>

        {canReview && !open && (
          <button
            onClick={() => setOpen(true)}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
            style={{ background: "var(--primary)" }}
          >
            {myReview ? "Edit your review" : "Write a review"}
          </button>
        )}
      </div>

      {open && (
        <div className="card p-5 mb-6">
          <StarRating value={rating} onChange={setRating} disabled={saving} />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you find useful about this course? (optional)"
            rows={4}
            maxLength={2000}
            className="w-full mt-4 px-4 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}
          />
          {error && <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>{error}</p>}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={submit}
              disabled={saving}
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white disabled:opacity-60"
              style={{ background: "var(--primary)" }}
            >
              {saving ? "Saving…" : "Post review"}
            </button>
            <button
              onClick={() => { setOpen(false); setError(null); }}
              className="text-sm font-semibold px-4 py-2 rounded-xl border"
              style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
            >
              Cancel
            </button>
            {myReview && (
              <button
                onClick={remove}
                disabled={saving}
                className="text-sm font-semibold px-4 py-2 rounded-xl ml-auto"
                style={{ color: "var(--danger)" }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--primary)" }}
                >
                  {(review.patients?.name || "P")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {review.patients?.name || "Learner"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Stars value={review.rating} size={12} />
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
              {review.body && (
                <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--foreground-secondary)" }}>
                  {review.body}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          {canReview ? "No reviews yet — be the first." : "No reviews yet."}
        </p>
      )}
    </div>
  );
}
