import { createAdminClient } from "@/lib/supabase/server";
import { SealCheck, WarningCircle } from "@phosphor-icons/react/ssr";
import CertificateDocument from "@/components/CertificateDocument";

export const metadata = { title: "Verify Certificate" };

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;

  // Public page: read with the service role, but surface only the fields that
  // belong on a certificate — recipient name, course, date, number.
  const admin = await createAdminClient();
  const { data: certificate } = await admin
    .from("certificates")
    .select(`
      id, certificate_number, issued_at,
      enrollments!inner (
        status,
        patients (name),
        courses (title, category)
      )
    `)
    .eq("id", certificateId)
    .maybeSingle();

  const enrollment = certificate?.enrollments as any;
  const isValid = Boolean(certificate) && enrollment?.status === "completed";

  return (
    <div className="max-w-4xl mx-auto px-6 py-14 print-area">
      {isValid ? (
        <>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 print-hidden"
            style={{ background: "var(--primary-light)" }}
          >
            <SealCheck size={22} weight="fill" style={{ color: "var(--success)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                Valid certificate
              </p>
              <p className="text-xs" style={{ color: "var(--foreground-secondary)" }}>
                Issued by Clinic Living Plus and confirmed against our records.
              </p>
            </div>
          </div>

          <CertificateDocument
            certificate={{
              certificateNumber: certificate!.certificate_number,
              issuedAt: certificate!.issued_at,
              recipientName: enrollment?.patients?.name ?? "Patient",
              courseTitle: enrollment?.courses?.title ?? "Course",
              courseCategory: enrollment?.courses?.category,
            }}
          />
        </>
      ) : (
        <div
          className="text-center py-20 rounded-2xl border"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "var(--warning-light)", color: "var(--warning)" }}><WarningCircle size={22} weight="duotone" /></div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Certificate not found
          </h1>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--foreground-secondary)" }}>
            We could not find a valid certificate with this ID. Check the link for typos, or ask the
            certificate holder to resend it.
          </p>
        </div>
      )}
    </div>
  );
}
