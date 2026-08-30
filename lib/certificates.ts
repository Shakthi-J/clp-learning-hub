import type { SupabaseClient } from "@supabase/supabase-js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alike chars

function randomSuffix(length = 8) {
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

export function buildCertificateNumber() {
  return `CLP-${new Date().getFullYear()}-${randomSuffix()}`;
}

/**
 * Issues a certificate for a completed enrollment, or returns the existing one.
 * Safe to call repeatedly — the unique index on enrollment_id makes this idempotent.
 * Requires a service-role client: patients cannot insert certificates themselves.
 */
export async function issueCertificate(admin: SupabaseClient, enrollmentId: string) {
  const { data: existing } = await admin
    .from("certificates")
    .select("id, certificate_number, issued_at")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();

  if (existing) return existing;

  // Retry on the vanishingly rare number collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await admin
      .from("certificates")
      .insert({ enrollment_id: enrollmentId, certificate_number: buildCertificateNumber() })
      .select("id, certificate_number, issued_at")
      .single();

    if (!error) return data;

    // 23505 = unique violation. If it was the enrollment index, another request won the race.
    if (error.code !== "23505") throw error;

    const { data: raced } = await admin
      .from("certificates")
      .select("id, certificate_number, issued_at")
      .eq("enrollment_id", enrollmentId)
      .maybeSingle();
    if (raced) return raced;
  }

  throw new Error("Could not allocate a unique certificate number");
}
