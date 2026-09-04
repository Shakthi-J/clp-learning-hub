"use client";
import type { SupabaseClient } from "@supabase/supabase-js";

export const ASSIGNMENT_FILES_BUCKET = "assignment-files";

export const MAX_FILE_BYTES = 20 * 1024 * 1024; // matches the bucket's own limit

export const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
};

export function describeFileError(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return "File is larger than 20 MB.";
  if (!ALLOWED_TYPES[file.type]) return "That file type isn't supported. Use a PDF, Word document, or image.";
  return null;
}

/**
 * Uploads under the signed-in user's own path, which is what the bucket's
 * RLS keys on - the client only ever needs the anon key plus a session.
 * Re-uploading for the same assignment overwrites the previous file rather
 * than leaving orphans behind.
 */
export async function uploadAssignmentFile(
  supabase: SupabaseClient,
  authUserId: string,
  assignmentId: string,
  file: File
): Promise<{ path: string; name: string; size: number }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${authUserId}/${assignmentId}/${safeName}`;

  const { error } = await supabase.storage
    .from(ASSIGNMENT_FILES_BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;
  return { path, name: file.name, size: file.size };
}

/** A short-lived link to view or download an attached file. */
export async function signedFileUrl(supabase: SupabaseClient, path: string) {
  const { data, error } = await supabase.storage
    .from(ASSIGNMENT_FILES_BUCKET)
    .createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
