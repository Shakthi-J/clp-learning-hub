import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Certificate, MagnifyingGlass } from "@phosphor-icons/react/ssr";
import EmptyState from "@/components/ui/EmptyState";

export const metadata = { title: "Certificates" };

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();

  // Staff can read every certificate under RLS, so the ordinary client is enough.
  const { data: certificates } = await supabase
    .from("certificates")
    .select(`id, certificate_number, issued_at,
             enrollments (completed_at, patients (name, email), courses (title, category))`)
    .order("issued_at", { ascending: false });

  const term = q.trim().toLowerCase();
  const rows = ((certificates as any[]) || []).filter((c) => {
    if (!term) return true;
    const haystack = [
      c.certificate_number,
      c.enrollments?.patients?.name,
      c.enrollments?.patients?.email,
      c.enrollments?.courses?.title,
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(term);
  });

  return (
    <div className="p-5 sm:p-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          Certificates
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
          Every certificate issued, with the learner it belongs to. Open one to download or print it.
        </p>
        </div>
        <Link href="/admin/certificates/template" className="px-5 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}>
          Edit design
        </Link>
      </div>

      <form className="mb-6 relative max-w-md">
        <MagnifyingGlass
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--foreground-muted)" }}
        />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by learner, course or number"
          aria-label="Search certificates"
          className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm border"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
        />
      </form>

      {rows.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--card-secondary)" }}>
                  {["Learner", "Course", "Certificate no.", "Issued", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: "var(--foreground-secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr key={c.id} className="border-b" style={{ borderColor: "var(--border-light)", background: i % 2 === 0 ? "var(--card)" : "var(--background)" }}>
                    <td className="px-5 py-3">
                      <div className="font-medium" style={{ color: "var(--foreground)" }}>
                        {c.enrollments?.patients?.name || "—"}
                      </div>
                      <div className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                        {c.enrollments?.patients?.email}
                      </div>
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--foreground-secondary)" }}>
                      {c.enrollments?.courses?.title || "—"}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--foreground)" }}>
                      {c.certificate_number}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {new Date(c.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/certificates/${c.id}`} className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Certificate size={22} weight="duotone" />}
          title={term ? "No certificates match that search" : "No certificates issued yet"}
          description={
            term
              ? "Try a learner name, email, course title or certificate number."
              : "Certificates are issued automatically when a learner finishes every lesson in a course."
          }
          tone="var(--accent-amber)"
        />
      )}
    </div>
  );
}
