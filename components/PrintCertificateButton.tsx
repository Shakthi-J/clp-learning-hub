"use client";

export default function PrintCertificateButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-sm font-semibold px-4 py-2 rounded-xl "
      style={{ background: "var(--primary)", color: "var(--on-primary)" }}
    >
      Download / Print PDF
    </button>
  );
}
