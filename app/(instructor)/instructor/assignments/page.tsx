import { getActor } from "@/lib/auth";
import { getManagedCourseIds } from "@/lib/instructor";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GradingQueue from "./GradingQueue";

export const metadata = { title: "Grading" };

export default async function InstructorGradingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "submitted" } = await searchParams;
  const actor = await getActor();
  if (!actor) redirect("/login");

  const supabase = await createClient();
  const courseIds = await getManagedCourseIds(actor);

  // Resolve which assignments belong to this instructor's courses, then fetch
  // only those submissions. Scoping happens on the server, not in the browser.
  let submissions: any[] = [];
  if (courseIds.length > 0) {
    const { data: assignments } = await supabase
      .from("assignments")
      .select("id, lessons!inner (modules!inner (course_id))")
      .in("lessons.modules.course_id", courseIds);

    const assignmentIds = (assignments || []).map((a: any) => a.id);

    if (assignmentIds.length > 0) {
      const { data } = await supabase
        .from("assignment_submissions")
        .select(`id, response, status, submitted_at, feedback,
                 patients!assignment_submissions_patient_id_fkey (name, email),
                 assignments (title, prompt)`)
        .in("assignment_id", assignmentIds)
        .eq("status", status)
        .order("submitted_at", { ascending: false });
      submissions = (data as any[]) || [];
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Grading</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
          Assignment submissions from learners in your courses
        </p>
      </div>
      <GradingQueue submissions={submissions} activeStatus={status} />
    </div>
  );
}
