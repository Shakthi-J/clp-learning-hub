"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowCounterClockwise } from "@phosphor-icons/react";
import CertificateDocument from "@/components/CertificateDocument";
import { DEFAULT_TEMPLATE, type CertificateTemplate } from "@/lib/certificateTemplate";

const TEXT_FIELDS: {
  key: keyof CertificateTemplate;
  label: string;
  help?: string;
  max: number;
}[] = [
  { key: "organisation_name", label: "Organisation name", max: 80 },
  { key: "logo_initials", label: "Logo initials", help: "Shown in the badge at the top.", max: 4 },
  { key: "title", label: "Certificate title", max: 60 },
  { key: "intro_line", label: "Line above the name", max: 80 },
  { key: "middle_line", label: "Line above the course", max: 80 },
  { key: "footer_note", label: "Footer note", help: "Optional. Accreditation wording, a disclaimer, anything.", max: 400 },
  { key: "signature_name", label: "Signature name", help: "Optional. Shown when the signature block is on.", max: 80 },
  { key: "signature_role", label: "Signature role", help: "Optional, e.g. Clinical Director.", max: 80 },
];

const TOGGLES: { key: keyof CertificateTemplate; label: string }[] = [
  { key: "show_category", label: "Course category" },
  { key: "show_issued_date", label: "Issue date" },
  { key: "show_certificate_number", label: "Certificate number" },
  { key: "show_signature", label: "Signature block" },
];

const PREVIEW = {
  certificateNumber: "CLP-2026-K7M2QX9P",
  issuedAt: new Date().toISOString(),
  recipientName: "Priya Ramanathan",
  courseTitle: "Gut Health Foundations",
  courseCategory: "Digestive Health",
};

export default function TemplateEditor({ initial }: { initial: CertificateTemplate }) {
  const router = useRouter();
  const [draft, setDraft] = useState<CertificateTemplate>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const set = <K extends keyof CertificateTemplate>(key: K, value: CertificateTemplate[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/certificate-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: "err", text: data.message || "Could not save" });
      return;
    }
    setMessage({ type: "ok", text: "Saved. Every certificate now uses this design." });
    router.refresh();
  };

  const inputStyle = {
    borderColor: "var(--border)",
    background: "var(--background)",
    color: "var(--foreground)",
  };

  return (
    <div className="p-8 max-w-6xl">
      <Link href="/admin/certificates" className="text-sm mb-6 inline-flex items-center gap-1.5" style={{ color: "var(--foreground-secondary)" }}>
        <ArrowLeft size={14} weight="bold" /> Certificates
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            Certificate design
          </h1>
          <p className="text-sm mt-1 max-w-[60ch]" style={{ color: "var(--foreground-secondary)" }}>
            Wording and appearance for every certificate the hub issues. Changes apply to
            certificates already issued as well, since the design is rendered fresh each time.
          </p>
        </div>
        <button
          onClick={() => { setDraft({ ...DEFAULT_TEMPLATE }); setMessage(null); }}
          className="text-sm font-semibold px-4 py-2.5 rounded-xl border inline-flex items-center gap-2"
          style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
        >
          <ArrowCounterClockwise size={14} weight="bold" /> Reset to defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-8 items-start">
        <div className="card p-6 space-y-5">
          {TEXT_FIELDS.map((field) => {
            const value = (draft[field.key] as string | null) ?? "";
            return (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                  {field.label}
                </label>
                {field.key === "footer_note" ? (
                  <textarea
                    value={value}
                    maxLength={field.max}
                    rows={3}
                    onChange={(e) => set(field.key, e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm"
                    style={inputStyle}
                  />
                ) : (
                  <input
                    value={value}
                    maxLength={field.max}
                    onChange={(e) => set(field.key, e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm"
                    style={inputStyle}
                  />
                )}
                {field.help && (
                  <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{field.help}</p>
                )}
              </div>
            );
          })}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
              Accent colour
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.accent_color}
                onChange={(e) => set("accent_color", e.target.value)}
                className="w-11 h-11 rounded-xl border cursor-pointer"
                style={{ borderColor: "var(--border)", background: "var(--background)" }}
                aria-label="Accent colour"
              />
              <input
                value={draft.accent_color}
                onChange={(e) => set("accent_color", e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-mono"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="pt-2" style={{ borderTop: "1px solid var(--border-light)" }}>
            <p className="text-sm font-medium mb-3 mt-4" style={{ color: "var(--foreground)" }}>Show on the certificate</p>
            <div className="space-y-2.5">
              {TOGGLES.map((toggle) => (
                <label key={toggle.key} className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: "var(--foreground-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(draft[toggle.key])}
                    onChange={(e) => set(toggle.key, e.target.checked as any)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "var(--primary)" }}
                  />
                  {toggle.label}
                </label>
              ))}
            </div>
          </div>

          {message && (
            <p className="text-xs" style={{ color: message.type === "ok" ? "var(--success)" : "var(--danger)" }}>
              {message.text}
            </p>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60"
            style={{ background: "var(--primary)", color: "var(--on-primary)" }}
          >
            {saving ? "Saving…" : "Save design"}
          </button>
        </div>

        <div className="lg:sticky lg:top-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-3" style={{ color: "var(--foreground-muted)" }}>
            Live preview
          </p>
          <CertificateDocument certificate={PREVIEW} template={draft} />
          <p className="text-xs mt-3" style={{ color: "var(--foreground-muted)" }}>
            Sample details. Real certificates use the learner, course and number on record.
          </p>
        </div>
      </div>
    </div>
  );
}
