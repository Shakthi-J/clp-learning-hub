import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/ssr";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import CertificateDocument from "@/components/CertificateDocument";
import { getCertificateTemplate } from "@/lib/certificateTemplate.server";
import CertificateReveal from "@/components/motion/CertificateReveal";
import PrintCertificateButton from "@/components/PrintCertificateButton";
import CopyVerifyLink from "./CopyVerifyLink";

export const metadata = { title: "Certificate" };

export default async function CertificatePage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  const supabase = await createClient();
  const template = await getCertificateTemplate();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patient } = await supabase
    .from("patients").select("id, name, email").eq("auth_user_id", user.id).single();

  // RLS restricts certificates to the signed-in patient's own enrollments.
  const { data: certificate } = await supabase
    .from("certificates")
    .select(`id, certificate_number, issued_at, enrollments!inner (patient_id, courses (title, category))`)
    .eq("id", certificateId)
    .maybeSingle();

  const enrollment = certificate?.enrollments as any;
  if (!certificate || enrollment?.patient_id !== patient?.id) notFound();

  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/verify/${certificate.id}`;

  return (
    <div className="p-8 max-w-4xl print-area">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap print-hidden">
        <Link href="/certificates" className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
          <span className="inline-flex items-center gap-1.5"><ArrowLeft size={14} weight="bold" /> All certificates</span>
        </Link>
        <div className="flex items-center gap-2">
          <CopyVerifyLink url={verifyUrl} />
          <PrintCertificateButton />
        </div>
      </div>

      <CertificateReveal>
        <CertificateDocument
          certificate={{
            certificateNumber: certificate.certificate_number,
            issuedAt: certificate.issued_at,
            recipientName: patient?.name || patient?.email || "Patient",
            courseTitle: enrollment?.courses?.title ?? "Course",
            courseCategory: enrollment?.courses?.category,
          }}
          template={template}
        />
      </CertificateReveal>

      <p className="text-xs text-center mt-4 print-hidden" style={{ color: "var(--foreground-muted)" }}>
        Anyone can confirm this certificate at{" "}
        <span className="font-mono">{verifyUrl}</span>
      </p>
    </div>
  );
}
