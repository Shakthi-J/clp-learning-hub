import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import CertificateDocument from "@/components/CertificateDocument";
import { getCertificateTemplate } from "@/lib/certificateTemplate.server";
import PrintCertificateButton from "@/components/PrintCertificateButton";
import CopyVerifyLink from "@/app/(patient)/certificates/[certificateId]/CopyVerifyLink";

export const metadata = { title: "Certificate" };

export default async function AdminCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const supabase = await createClient();
  const template = await getCertificateTemplate();

  const { data: certificate } = await supabase
    .from("certificates")
    .select(`id, certificate_number, issued_at,
             enrollments (completed_at, patients (name, email), courses (title, category))`)
    .eq("id", certificateId)
    .maybeSingle();

  if (!certificate) notFound();

  const enrollment = certificate.enrollments as any;
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/verify/${certificate.id}`;

  return (
    <div className="p-5 sm:p-8 max-w-4xl print-area">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap print-hidden">
        <Link href="/admin/certificates" className="text-sm inline-flex items-center gap-1.5" style={{ color: "var(--foreground-secondary)" }}>
          <ArrowLeft size={14} weight="bold" /> All certificates
        </Link>
        <div className="flex items-center gap-2">
          <CopyVerifyLink url={verifyUrl} />
          <PrintCertificateButton />
        </div>
      </div>

      <div className="card p-4 mb-6 print-hidden">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[
            ["Learner", enrollment?.patients?.name || "—"],
            ["Email", enrollment?.patients?.email || "—"],
            ["Course", enrollment?.courses?.title || "—"],
            ["Completed", enrollment?.completed_at
              ? new Date(enrollment.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="uppercase tracking-wider mb-1" style={{ color: "var(--foreground-muted)" }}>{label}</dt>
              <dd className="font-medium truncate" style={{ color: "var(--foreground)" }}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <CertificateDocument
        certificate={{
          certificateNumber: certificate.certificate_number,
          issuedAt: certificate.issued_at,
          recipientName: enrollment?.patients?.name || enrollment?.patients?.email || "Patient",
          courseTitle: enrollment?.courses?.title ?? "Course",
          courseCategory: enrollment?.courses?.category,
        }}
        template={template}
      />

      <p className="text-xs text-center mt-4 print-hidden" style={{ color: "var(--foreground-muted)" }}>
        Verifiable at <span className="font-mono">{verifyUrl}</span>
      </p>
    </div>
  );
}
