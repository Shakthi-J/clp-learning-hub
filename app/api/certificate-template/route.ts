import { createClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/auth";
import { NextResponse } from "next/server";

const TEXT_FIELDS = [
  "organisation_name", "logo_initials", "title", "intro_line",
  "middle_line", "footer_note", "signature_name", "signature_role", "accent_color",
] as const;

const FLAG_FIELDS = [
  "show_category", "show_issued_date", "show_certificate_number", "show_signature",
] as const;

const LIMITS: Record<string, number> = {
  organisation_name: 80, logo_initials: 4, title: 60, intro_line: 80,
  middle_line: 80, footer_note: 400, signature_name: 80, signature_role: 80,
};

export async function PUT(request: Request) {
  const actor = await getActor();
  // Clinic-wide design, so admin only - an instructor changing it would alter
  // every other instructor's certificates too.
  if (actor?.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const update: Record<string, unknown> = {};

  for (const field of TEXT_FIELDS) {
    if (!(field in body)) continue;
    const raw = body[field];
    const value = typeof raw === "string" ? raw.trim() : "";
    const limit = LIMITS[field];
    if (limit && value.length > limit) {
      return NextResponse.json({ message: `${field.replace(/_/g, " ")} must be under ${limit} characters` }, { status: 400 });
    }
    // Optional fields clear to null; required ones must not be blanked.
    const optional = ["footer_note", "signature_name", "signature_role"];
    if (!value && !optional.includes(field)) {
      return NextResponse.json({ message: `${field.replace(/_/g, " ")} cannot be empty` }, { status: 400 });
    }
    update[field] = value || (optional.includes(field) ? null : value);
  }

  if (typeof update.accent_color === "string" && !/^#[0-9a-fA-F]{6}$/.test(update.accent_color)) {
    return NextResponse.json({ message: "Accent colour must be a hex value like #2e7d32" }, { status: 400 });
  }

  for (const field of FLAG_FIELDS) {
    if (field in body) update[field] = Boolean(body[field]);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();
  update.updated_by = actor.id;

  const supabase = await createClient();
  const { error } = await supabase.from("certificate_template").update(update).eq("id", true);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
