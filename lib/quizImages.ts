"use client";
import type { SupabaseClient } from "@supabase/supabase-js";

export const QUIZ_IMAGES_BUCKET = "quiz-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function describeImageError(file: File): string | null {
  if (file.size > MAX_IMAGE_BYTES) return "Image is larger than 5 MB.";
  if (!ALLOWED_TYPES.has(file.type)) return "Use a JPEG, PNG, WebP, or GIF image.";
  return null;
}

/** Public bucket - the path itself is what other code stores as image_path. */
export async function uploadQuizImage(supabase: SupabaseClient, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(QUIZ_IMAGES_BUCKET).upload(path, file);
  if (error) throw error;
  return path;
}

/**
 * Public bucket, so the URL is a deterministic pattern - no client instance
 * or network round trip needed to resolve it, which matters here since
 * learner-facing quiz components don't otherwise need a Supabase client.
 */
export function quizImageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${QUIZ_IMAGES_BUCKET}/${path}`;
}
