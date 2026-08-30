import { getActor } from "@/lib/auth";
import { BookOpen, Globe, Users, PencilLine, CaretRight } from "@phosphor-icons/react/ssr";
import { getManagedCourses, getManagedCourseIds, countLessons } from "@/lib/instructor";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatCard from "@/components/StatCard";

export const metadata = { title: "Instructor Dashboard" };

export default async function InstructorDashboardPage() {
  const actor = await getActor();
  if (!actor) redirect("/login");

  const supabase = await createClient();
  const courses = await getManagedCourses(actor);
  const courseIds = courses.map((course) => course.id);

  let activeLearners = 0;
  let completions = 0;
  let pendingGrading = 0;

  if (courseIds.length > 0) {
    const [{ count: active }, { count: done }] = await Promise.all([
      supabase.from("enrollments").select("*", { count: "exact", head: true })
        .in("course_id", courseIds).eq("status", "active"),
      supabase.from("enrollments").select("*", { count: "exact", head: true })
        .in("course_id", courseIds).eq("status", "completed"),
    ]);
    activeLearners = active ?? 0;
    completions = done ?? 0;

    const { data: assignments } = await supabase
      .from("assignments")
      .select("id, lessons!inner (modules!inner (course_id))")
      .in("lessons.modules.course_id", courseIds);

    const assignmentIds = (assignments || []).map((a: any) => a.id);
    if (assignmentIds.length > 0) {
      const { count } = await supabase
        .from("assignment_submissions").select("*", { count: "exact", head: true })
        .in("assignment_id", assignmentIds).eq("status", "submitted");
      pendingGrading = count ?? 0;
    }
  }

  const publishedCount = courses.filter((course) => course.published).length;

  const stats = [
    { label: "My Courses", value: courses.length, icon: <BookOpen size={18} weight="duotone" />, accent: "blue" as const },
    { label: "Published", value: publishedCount, icon: <Globe size={18} weight="duotone" />, accent: "teal" as const },
    { label: "Active Learners", value: activeLearners, icon: <Users size={18} weight="duotone" />, accent: "purple" as const },
    { label: "Awaiting Grading", value: pendingGrading, icon: <PencilLine size={18} weight="duotone" />, accent: "warning" as const, highlight: pendingGrading > 0 },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Welcome{actor.name ? `, ${actor.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
          {completions} learner{completions !== 1 ? "s have" : " has"} completed your courses
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 stagger">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} accent={stat.accent} highlight={stat.highlight} />
        ))}
      </div>

      {courses.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Your Courses</h2>
            <Link href="/instructor/courses" className="text-sm font-semibold" style={{ color: "var(--primary)" }}><span className="inline-flex items-center gap-1.5">View all <CaretRight size={13} weight="bold" /></span></Link>
          </div>
          <div className="space-y-3">
            {courses.slice(0, 5).map((course) => (
              <Link key={course.id} href={`/instructor/courses/${course.id}`} className="card card-hover p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>{course.title}</h3>
                  <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                    {(course.modules?.length ?? 0)} module{(course.modules?.length ?? 0) !== 1 ? "s" : ""} · {countLessons(course)} lesson{countLessons(course) !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${course.published ? "success-pill" : "warning-pill"}`}>
                  {course.published ? "Published" : "Draft"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "var(--accent-blue-light)", color: "var(--accent-blue)" }}><BookOpen size={22} weight="duotone" /></div>
          <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>No courses yet</h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--foreground-secondary)" }}>
            Create your first course and it appears here, along with its learners and grading queue.
          </p>
          <Link href="/instructor/courses/new" className="inline-block mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold primary-gradient">
            Create a course
          </Link>
        </div>
      )}
    </div>
  );
}
