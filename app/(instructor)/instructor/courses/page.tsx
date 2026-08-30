import { getActor } from "@/lib/auth";
import { BookOpen } from "@phosphor-icons/react/ssr";
import { getManagedCourses, countLessons } from "@/lib/instructor";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "My Courses" };

export default async function InstructorCoursesPage() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  const courses = await getManagedCourses(actor);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>My Courses</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
            {courses.length} course{courses.length !== 1 ? "s" : ""} you own
          </p>
        </div>
        <Link href="/instructor/courses/new" className="px-5 py-2.5 rounded-xl text-sm font-semibold primary-gradient">
          + New course
        </Link>
      </div>

      {courses.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--card-secondary)" }}>
                {["Course", "Category", "Content", "Status", ""].map((header) => (
                  <th key={header} className="text-left px-5 py-3 font-medium" style={{ color: "var(--foreground-secondary)" }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map((course, i) => (
                <tr key={course.id} className="border-b" style={{ borderColor: "var(--border-light)", background: i % 2 === 0 ? "var(--card)" : "var(--background)" }}>
                  <td className="px-5 py-3 font-medium" style={{ color: "var(--foreground)" }}>{course.title}</td>
                  <td className="px-5 py-3" style={{ color: "var(--foreground-secondary)" }}>{course.category || "—"}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {(course.modules?.length ?? 0)} module{(course.modules?.length ?? 0) !== 1 ? "s" : ""} · {countLessons(course)} lesson{countLessons(course) !== 1 ? "s" : ""}
                  </td>
                  <td className="px-5 py-3">
                    <span className={course.published ? "text-xs font-semibold px-2 py-1 rounded-full success-pill" : "text-xs font-semibold px-2 py-1 rounded-full warning-pill"}>
                      {course.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/instructor/courses/${course.id}/lessons`} className="text-xs font-semibold" style={{ color: "var(--foreground-secondary)" }}>Lessons</Link>
                      <Link href={`/instructor/courses/${course.id}`} className="text-xs font-semibold" style={{ color: "var(--primary)" }}>Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "var(--accent-blue-light)", color: "var(--accent-blue)" }}><BookOpen size={22} weight="duotone" /></div>
          <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>No courses yet</h3>
          <p className="text-sm max-w-md mx-auto mb-6" style={{ color: "var(--foreground-secondary)" }}>
            Create your first course, or ask a CLP admin to assign you an existing one.
          </p>
          <Link href="/instructor/courses/new" className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold primary-gradient">
            Create a course
          </Link>
        </div>
      )}
    </div>
  );
}
