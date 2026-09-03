import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, ArrowRight, CheckCircle, Compass } from "@phosphor-icons/react/ssr";
import { categoryPillStyle, categoryColor } from "@/lib/categoryColor";
import EmptyState from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export const metadata = { title: "My Learning" };

export default async function MyLearningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: patient } = await supabase
    .from("patients").select("id, name, access_type").eq("auth_user_id", user!.id).single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`id, status, enrolled_at,
             courses (slug, title, category, modules (id, lessons!lessons_module_id_fkey (id))),
             lesson_progress (completed)`)
    .eq("patient_id", patient?.id)
    .order("enrolled_at", { ascending: false });

  const rows = (enrollments as any[]) || [];
  const inProgress = rows.filter((e) => e.status === "active");
  const finished = rows.filter((e) => e.status === "completed");
  const firstName = patient?.name ? patient.name.split(" ")[0] : null;

  const renderCourse = (enrollment: any) => {
    const course = enrollment.courses;
    const progress = (enrollment.lesson_progress as any[]) || [];
    const completed = progress.filter((p) => p.completed).length;
    // Total comes from the course itself: lesson_progress rows only exist once a
    // lesson has been started, so counting them would show "0 of 0".
    const total = ((course?.modules as any[]) || []).reduce(
      (acc: number, m: any) => acc + (m.lessons?.length || 0), 0
    );
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isDone = enrollment.status === "completed";
    const hue = categoryColor(course?.category);

    return (
      <div key={enrollment.id} className="card card-hover p-5 group">
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              {course?.category && (
                <span
                  className="text-[11px] font-semibold px-2 py-1 rounded-full leading-none"
                  style={categoryPillStyle(course.category)}
                >
                  {course.category}
                </span>
              )}
              {isDone && (
                <Badge tone="success" icon={<CheckCircle size={12} weight="fill" />}>
                  Completed
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-[15px] tracking-tight mb-4" style={{ color: "var(--foreground)" }}>
              {course?.title}
            </h3>

            <div className="flex items-center justify-between text-xs mb-2">
              <span style={{ color: "var(--foreground-muted)" }}>
                <span className="font-mono" style={{ color: "var(--foreground-secondary)" }}>
                  {completed}
                </span>
                {" of "}
                <span className="font-mono">{total}</span> lessons
              </span>
              <span className="font-mono font-medium" style={{ color: isDone ? "var(--success)" : hue }}>
                {pct}%
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ background: "var(--border-light)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, background: isDone ? "var(--success)" : hue }}
              />
            </div>
          </div>

          {course?.slug && (
            <div className="flex-shrink-0 self-center">
              <ButtonLink
                href={`/learn/${course.slug}`}
                variant={isDone ? "secondary" : "primary"}
                size="sm"
                iconRight={<ArrowRight size={13} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" />}
              >
                {isDone ? "Review" : pct > 0 ? "Continue" : "Start"}
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 sm:p-6 md:p-10 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>
            {inProgress.length > 0
              ? `${inProgress.length} course${inProgress.length !== 1 ? "s" : ""} in progress`
              : "Nothing in progress right now"}
          </p>
          {patient?.access_type && (
            <Badge
              style={
                patient.access_type === "all_access"
                  ? { background: "var(--accent-indigo-light)", color: "var(--accent-indigo)" }
                  : { background: "var(--card-secondary)", color: "var(--foreground-secondary)" }
              }
            >
              {patient.access_type === "all_access" ? "All Access" : "Single Course"}
            </Badge>
          )}
        </div>
      </header>

      {rows.length > 0 ? (
        <div className="space-y-10">
          {inProgress.length > 0 && (
            <section>
              <h2
                className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-3"
                style={{ color: "var(--foreground-muted)" }}
              >
                Continue learning
              </h2>
              <div className="space-y-3 stagger">{inProgress.map(renderCourse)}</div>
            </section>
          )}

          {finished.length > 0 && (
            <section>
              <h2
                className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-3"
                style={{ color: "var(--foreground-muted)" }}
              >
                Completed
              </h2>
              <div className="space-y-3">{finished.map(renderCourse)}</div>
            </section>
          )}

          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: "var(--primary)" }}
          >
            <Compass size={16} weight="duotone" />
            Browse the full catalog
          </Link>
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen size={22} weight="duotone" />}
          title="No courses yet"
          description="Browse the catalog and request enrollment. Your care team reviews each request, usually within a day."
          action={
            <ButtonLink href="/courses" size="sm" iconRight={<ArrowRight size={14} weight="bold" />}>
              Browse courses
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
