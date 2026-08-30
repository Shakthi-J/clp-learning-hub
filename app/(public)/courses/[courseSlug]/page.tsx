import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import EnrollButton from "./EnrollButton";
import { categoryPillStyle } from "@/lib/categoryColor";
import CourseReviews from "@/components/CourseReviews";
import { Stars } from "@/components/StarRating";

export default async function CourseDetailPage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select(`
      id, slug, title, description, category, thumbnail_url, avg_rating, review_count,
      modules (
        id, title, order,
        lessons!lessons_module_id_fkey (id, title, order)
      )
    `)
    .eq("slug", courseSlug)
    .eq("published", true)
    .single();
  if (!course) notFound();
  const { data: { user } } = await supabase.auth.getUser();

  // Reviews are public; the write gate lives in /api/reviews.
  const { data: reviews } = await supabase
    .from("course_reviews")
    .select("id, rating, body, created_at, patient_id, patients (name)")
    .eq("course_id", course.id)
    .order("created_at", { ascending: false })
    .limit(50);

  let canReview = false;
  let myReview: { rating: number; body: string | null } | null = null;
  if (user) {
    const { data: viewer } = await supabase
      .from("patients").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (viewer) {
      const { data: enrollment } = await supabase
        .from("enrollments").select("id")
        .eq("course_id", course.id).eq("patient_id", viewer.id)
        .in("status", ["active", "completed"]).maybeSingle();
      canReview = Boolean(enrollment);
      const mine = ((reviews as any[]) || []).find((r) => r.patient_id === viewer.id);
      if (mine) myReview = { rating: mine.rating, body: mine.body };
    }
  }

  const modules = ((course.modules as any[]) || []).sort((a, b) => a.order - b.order);
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  return (
    <div className="max-w-4xl mx-auto px-6 py-14">
      <Link href="/courses" className="text-sm mb-8 inline-flex items-center gap-1" style={{ color: "var(--foreground-secondary)" }}>← Back to Courses</Link>
      <div className="card p-8 mb-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1">
            {course.category && <span className="text-xs font-semibold px-2 py-1 rounded-full" style={categoryPillStyle(course.category)}>{course.category}</span>}
            <h1 className="text-2xl font-bold mt-3 mb-3" style={{ color: "var(--foreground)" }}>{course.title}</h1>
            <p style={{ color: "var(--foreground-secondary)" }}>{course.description}</p>
            <div className="mt-4 flex items-center gap-3 flex-wrap text-sm" style={{ color: "var(--foreground-muted)" }}>
              <span>{modules.length} module{modules.length !== 1 ? "s" : ""} · {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}</span>
              {(course.review_count ?? 0) > 0 && (
                <span className="flex items-center gap-1.5">
                  <Stars value={Number(course.avg_rating) || 0} size={13} />
                  <span style={{ color: "var(--foreground-secondary)" }}>{(Number(course.avg_rating) || 0).toFixed(1)}</span>
                  <span>({course.review_count})</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 w-full md:w-auto"><EnrollButton courseId={course.id} isLoggedIn={!!user} /></div>
        </div>
      </div>
      {modules.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>What you will learn</h2>
          <div className="space-y-3">
            {modules.map((mod, i) => {
              const lessons = (mod.lessons || []).sort((a: any, b: any) => a.order - b.order);
              return (
                <div key={mod.id} className="card">
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={categoryPillStyle(course.category)}>{i + 1}</div>
                    <span className="font-medium" style={{ color: "var(--foreground)" }}>{mod.title}</span>
                    <span className="ml-auto text-xs" style={{ color: "var(--foreground-muted)" }}>{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</span>
                  </div>
                  {lessons.length > 0 && (
                    <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "var(--border-light)" }}>
                      {lessons.map((lesson: any) => (
                        <div key={lesson.id} className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground-secondary)" }}>
                          <span>▶</span><span>{lesson.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-12">
        <CourseReviews
          courseId={course.id}
          reviews={(reviews as any[]) || []}
          avgRating={Number(course.avg_rating) || 0}
          reviewCount={course.review_count ?? 0}
          canReview={canReview}
          myReview={myReview}
        />
      </div>
    </div>
  );
}
