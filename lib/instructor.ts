import { createClient } from "@/lib/supabase/server";
import type { Actor } from "@/lib/auth";

/**
 * Courses this actor manages. Instructors see only their assigned courses;
 * admins previewing the instructor area see everything.
 */
export async function getManagedCourses(actor: Actor) {
  const supabase = await createClient();
  let query = supabase
    .from("courses")
    .select(`id, slug, title, category, published, created_at, instructor_id,
             modules (id, lessons!lessons_module_id_fkey (id))`)
    .order("created_at", { ascending: false });

  if (actor.role !== "admin") query = query.eq("instructor_id", actor.id);

  const { data } = await query;
  return (data as any[]) || [];
}

export async function getManagedCourseIds(actor: Actor): Promise<string[]> {
  const courses = await getManagedCourses(actor);
  return courses.map((course) => course.id);
}

export function countLessons(course: any): number {
  return ((course.modules as any[]) || []).reduce(
    (acc, module) => acc + (module.lessons?.length || 0),
    0
  );
}
