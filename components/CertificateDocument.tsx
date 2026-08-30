import { DEFAULT_TEMPLATE, type CertificateTemplate } from "@/lib/certificateTemplate";

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

/**
 * The printable certificate. Wording, visibility and accent colour all come
 * from the admin-editable template, so changing the design never needs a deploy.
 */
export default function CertificateDocument({
  certificate,
  template = DEFAULT_TEMPLATE,
}: {
  certificate: CertificateData;
  template?: CertificateTemplate;
}) {
  const accent = template.accent_color || DEFAULT_TEMPLATE.accent_color;

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
        style={{ border: `2px solid ${accent}33`, borderRadius: "var(--radius-md)" }}
      />

      <div className="relative flex flex-col items-center gap-1 mb-6">
        {template.logo_initials && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-base font-bold mb-3"
            style={{ background: accent }}
          >
            {template.logo_initials}
          </div>
        )}
        {template.organisation_name && (
          <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--foreground-muted)" }}>
            {template.organisation_name}
          </p>
        )}
      </div>

      <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-5" style={{ color: accent }}>
        {template.title}
      </p>

      {template.intro_line && (
        <p className="text-sm mb-2" style={{ color: "var(--foreground-secondary)" }}>
          {template.intro_line}
        </p>
      )}
      <h1 className="text-2xl md:text-4xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
        {certificate.recipientName}
      </h1>

      {template.middle_line && (
        <p className="text-sm mb-2" style={{ color: "var(--foreground-secondary)" }}>
          {template.middle_line}
        </p>
      )}
      <h2 className="text-lg md:text-2xl font-semibold mb-1 max-w-2xl" style={{ color: accent }}>
        {certificate.courseTitle}
      </h2>
      {template.show_category && certificate.courseCategory && (
        <p className="text-xs mb-2" style={{ color: "var(--foreground-muted)" }}>
          {certificate.courseCategory}
        </p>
      )}

      {template.footer_note && (
        <p className="text-xs mt-4 max-w-lg leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
          {template.footer_note}
        </p>
      )}

      {template.show_signature && template.signature_name && (
        <div className="mt-6 flex flex-col items-center">
          <div className="w-40 mb-1.5" style={{ borderTop: "1px solid var(--border)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            {template.signature_name}
          </p>
          {template.signature_role && (
            <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
              {template.signature_role}
            </p>
          )}
        </div>
      )}

      {(template.show_issued_date || template.show_certificate_number) && (
        <div
          className="relative mt-auto pt-6 w-full flex flex-wrap items-end justify-between gap-4 text-left"
          style={{ borderTop: "1px solid var(--border-light)" }}
        >
          {template.show_issued_date ? (
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--foreground-muted)" }}>
                Issued
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {formatDate(certificate.issuedAt)}
              </p>
            </div>
          ) : <span />}

          {template.show_certificate_number && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--foreground-muted)" }}>
                Certificate No.
              </p>
              <p className="text-sm font-mono font-medium" style={{ color: "var(--foreground)" }}>
                {certificate.certificateNumber}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
