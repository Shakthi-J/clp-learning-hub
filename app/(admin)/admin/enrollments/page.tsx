import { createClient } from "@/lib/supabase/server";
import { ClipboardText } from "@phosphor-icons/react/ssr";
import RequestList from "./RequestList";
import EnrollmentCounts from "./EnrollmentCounts";

export const metadata = { title: "Enrollments" };

export default async function AdminEnrollmentsPage() {
  const supabase = await createClient();

  // Every status in one query: the tabs need counts, and the whole queue is
  // small enough that three round trips would be the wrong trade.
  const { data: requests } = await supabase
    .from("enrollment_requests")
    .select(
      `id, requested_at, status,
       patients!enrollment_requests_patient_id_fkey (name, email, access_type),
       courses (title, category)`
    )
    .order("requested_at", { ascending: false });

  // Actual "who's in this course right now" - separate from the request
  // queue above, and deliberately not derived from it: a course-pass grant
  // (single_course/selected_courses) enrols someone directly and never
  // creates a request row, so counting requests would silently undercount.
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("status, courses (title, category)")
    .in("status", ["active", "completed"]);

  const total = requests?.length ?? 0;

  return (
    <div className="p-5 sm:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          Enrollment requests
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
          Learners asking to join a course. Approving one enrols them straight away.
        </p>
      </div>

      <EnrollmentCounts enrollments={(enrollments as any[]) || []} />

      {total > 0 ? (
        <RequestList requests={(requests as any[]) || []} />
      ) : (
        <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: "var(--warning-light)", color: "var(--warning)" }}
          >
            <ClipboardText size={22} weight="duotone" />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>No requests yet</h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--foreground-secondary)" }}>
            Requests appear here when a learner asks to join a course. Learners on the Selected
            Courses tier are assigned directly and never appear here.
          </p>
        </div>
      )}
    </div>
  );
}
