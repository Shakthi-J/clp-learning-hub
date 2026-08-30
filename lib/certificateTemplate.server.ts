import "server-only";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TEMPLATE, TEMPLATE_FIELDS, type CertificateTemplate } from "@/lib/certificateTemplate";

/**
 * The clinic-wide certificate template. Falls back to defaults rather than
 * throwing, so a missing row degrades to the original wording instead of
 * breaking a learner's certificate.
 */
export async function getCertificateTemplate(): Promise<CertificateTemplate> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("certificate_template").select(TEMPLATE_FIELDS).eq("id", true).maybeSingle();
    return data ? { ...DEFAULT_TEMPLATE, ...(data as any) } : DEFAULT_TEMPLATE;
  } catch {
    return DEFAULT_TEMPLATE;
  }
}
