import { createClient } from "@/lib/supabase/server";
import EnrollmentActions from "./EnrollmentActions";

export const metadata = { title: "Enrollments" };

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const filter = (tab as "requested" | "approved" | "rejected") || "requested";

  const supabase = await createClient();

  const { data: requests, error } = await supabase
    .from("enrollment_requests")
    .select(`id, requested_at, status, patients!enrollment_requests_patient_id_fkey (name, email, access_type), courses (title, category)`)
    .eq("status", filter)
    .order("requested_at", { ascending: false });

  console.log("ENROLLMENT REQUESTS:", requests, "ERROR:", error);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Enrollment Requests
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
          Review and manage patient enrollment requests
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["requested", "approved", "rejected"] as const).map((tab) => (
          <a
            key={tab}
            href={`/admin/enrollments?tab=${tab}`}
            className="px-4 py-2 rounded-xl text-sm font-semibold capitalize"
            style={
              filter === tab
                ? { background: "var(--primary)", color: "white" }
                : { background: "var(--card)", color: "var(--foreground-secondary)", border: "1px solid var(--border)" }
            }
          >
            {tab}
          </a>
        ))}
      </div>

      {!requests || requests.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl border"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <span className="text-4xl block mb-3">📋</span>
          <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            No {filter} requests
          </h3>
          <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>
            {filter === "requested"
              ? "All caught up — no pending requests."
              : `No ${filter} requests to show.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => (
            <div key={req.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--primary)" }}
                    >
                      {(req.patients?.name || req.patients?.email || "P")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                        {req.patients?.name || "Unknown"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                        {req.patients?.email}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full ml-2"
                      style={{
                        background: req.patients?.access_type === "all_access" ? "var(--primary-light)" : "var(--beige-light)",
                        color: req.patients?.access_type === "all_access" ? "var(--primary)" : "var(--foreground-muted)",
                      }}
                    >
                      {req.patients?.access_type === "all_access" ? "All Access" : "Single Course"}
                    </span>
                  </div>

                  <div className="mt-2 ml-9">
                    <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>
                      Requested:{" "}
                      <strong style={{ color: "var(--foreground)" }}>{req.courses?.title}</strong>
                      {req.courses?.category && (
                        <span
                          className="ml-2 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                        >
                          {req.courses.category}
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                      {new Date(req.requested_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {filter === "requested" && <EnrollmentActions id={req.id} />}

                {filter !== "requested" && (
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
                    style={
                      filter === "approved"
                        ? { background: "#e8f5e9", color: "#2e7d32" }
                        : { background: "#fef2f2", color: "#dc2626" }
                    }
                  >
                    {filter === "approved" ? "Approved" : "Rejected"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}