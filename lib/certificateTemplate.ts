export type CertificateTemplate = {
  organisation_name: string;
  logo_initials: string;
  title: string;
  intro_line: string;
  middle_line: string;
  footer_note: string | null;
  signature_name: string | null;
  signature_role: string | null;
  accent_color: string;
  show_category: boolean;
  show_issued_date: boolean;
  show_certificate_number: boolean;
  show_signature: boolean;
};

/** Used when the row is missing, so a certificate never renders blank. */
export const DEFAULT_TEMPLATE: CertificateTemplate = {
  organisation_name: "Clinic Living Plus",
  logo_initials: "CL",
  title: "Certificate of Completion",
  intro_line: "This certifies that",
  middle_line: "has successfully completed",
  footer_note: null,
  signature_name: null,
  signature_role: null,
  accent_color: "#2e7d32",
  show_category: true,
  show_issued_date: true,
  show_certificate_number: true,
  show_signature: false,
};

export const TEMPLATE_FIELDS =
  "organisation_name, logo_initials, title, intro_line, middle_line, footer_note, " +
  "signature_name, signature_role, accent_color, show_category, show_issued_date, " +
  "show_certificate_number, show_signature";
