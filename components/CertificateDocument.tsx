export type CertificateData = {
  certificateNumber: string;
  issuedAt: string;
  recipientName: string;
  courseTitle: string;
  courseCategory?: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

/** The printable certificate itself. Rendered on both the patient page and the public verify page. */
export default function CertificateDocument({ certificate }: { certificate: CertificateData }) {
  return (
    <div
      id="certificate-document"
      className="relative w-full aspect-[1.414/1] p-10 md:p-14 flex flex-col items-center justify-center text-center"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        className="absolute inset-4 md:inset-6 pointer-events-none"
        style={{ border: "2px solid var(--primary-light)", borderRadius: "var(--radius-md)" }}
      />

      <div className="relative flex flex-col items-center gap-1 mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-base font-bold mb-3"
          style={{ background: "var(--primary)" }}
        >
          CL
        </div>
        <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--foreground-muted)" }}>
          Clinic Living Plus
        </p>
      </div>

      <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-5" style={{ color: "var(--primary)" }}>
        Certificate of Completion
      </p>

      <p className="text-sm mb-2" style={{ color: "var(--foreground-secondary)" }}>
        This certifies that
      </p>
      <h1 className="text-2xl md:text-4xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
        {certificate.recipientName}
      </h1>

      <p className="text-sm mb-2" style={{ color: "var(--foreground-secondary)" }}>
        has successfully completed
      </p>
      <h2 className="text-lg md:text-2xl font-semibold mb-1 max-w-2xl" style={{ color: "var(--primary)" }}>
        {certificate.courseTitle}
      </h2>
      {certificate.courseCategory && (
        <p className="text-xs mb-6" style={{ color: "var(--foreground-muted)" }}>
          {certificate.courseCategory}
        </p>
      )}

      <div
        className="relative mt-auto pt-6 w-full flex flex-wrap items-end justify-between gap-4 text-left"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--foreground-muted)" }}>
            Issued
          </p>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            {formatDate(certificate.issuedAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--foreground-muted)" }}>
            Certificate No.
          </p>
          <p className="text-sm font-mono font-medium" style={{ color: "var(--foreground)" }}>
            {certificate.certificateNumber}
          </p>
        </div>
      </div>
    </div>
  );
}
