import { createClient } from "@/lib/supabase/server";
import { Certificate, ArrowRight } from "@phosphor-icons/react/ssr";
import { redirect } from "next/navigation";
import Link from "next/link";
import IssueCertificateButton from "./IssueCertificateButton";

export const metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patient } = await supabase
    .from("patients").select("id").eq("auth_user_id", user.id).single();

  const { data: completed } = await supabase
    .from("enrollments")
    .select(`id, completed_at, courses (slug, title, category), certificates (id, certificate_number, issued_at)`)
    .eq("patient_id", patient?.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  const rows = (completed || []).map((enrollment: any) => ({
    enrollmentId: enrollment.id,
    course: enrollment.courses,
    // Supabase returns an array for the reverse relation.
    certificate: Array.isArray(enrollment.certificates)
      ? enrollment.certificates[0] ?? null
      : enrollment.certificates ?? null,
  }));

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Certificates</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
          Every course you finish earns a verifiable certificate.
        </p>
      </div>

      {rows.length > 0 ? (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.enrollmentId} className="card p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "var(--accent-amber-light)" }}
                >
                  <Certificate size={20} weight="duotone" style={{ color: "var(--accent-amber)" }} />
                </div>
                <div className="min-w-0">
                  {row.course?.category && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                    >
                      {row.course.category}
                    </span>
                  )}
                  <h2 className="font-semibold mt-2" style={{ color: "var(--foreground)" }}>
                    {row.course?.title}
                  </h2>
                  {row.certificate ? (
                    <p className="text-xs mt-1 font-mono" style={{ color: "var(--foreground-muted)" }}>
                      {row.certificate.certificate_number}
                    </p>
                  ) : (
                    <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                      Ready to issue
                    </p>
                  )}
                </div>
              </div>

              {row.certificate ? (
                <Link
                  href={`/certificates/${row.certificate.id}`}
                  className="text-sm font-semibold px-4 py-2 rounded-xl  flex-shrink-0"
                  style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                >
                  View Certificate
                </Link>
              ) : (
                <IssueCertificateButton enrollmentId={row.enrollmentId} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="text-center py-20 rounded-2xl border"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "var(--accent-amber-light)", color: "var(--accent-amber)" }}><Certificate size={22} weight="duotone" /></div>
          <p className="mb-1" style={{ color: "var(--foreground-secondary)" }}>
            No certificates yet.
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
            Finish every lesson in a course and your certificate appears here automatically.
          </p>
          <Link href="/my-learning" className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
            Back to My Learning
          </Link>
        </div>
      )}
    </div>
  );
}
