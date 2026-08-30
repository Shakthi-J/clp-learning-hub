import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "instructor" | "patient";

export type Actor = {
  id: string;          // patients.id
  authUserId: string;
  role: Role;
  name: string | null;
  email: string | null;
};

/** The signed-in person, or null. Never trusts client input for role. */
export async function getActor(): Promise<Actor | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("patients")
    .select("id, role, name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    authUserId: user.id,
    role: (data.role ?? "patient") as Role,
    name: data.name ?? null,
    email: data.email ?? null,
  };
}

export function isStaff(actor: Actor | null): boolean {
  return actor?.role === "admin" || actor?.role === "instructor";
}

/**
 * Can this actor manage this course?
 * Admins manage everything. Instructors manage only courses assigned to them.
 * Returns false for an unowned course held by an instructor — assignment is an admin action.
 */
export async function canManageCourse(actor: Actor | null, courseId: string): Promise<boolean> {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  if (actor.role !== "instructor") return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("instructor_id")
    .eq("id", courseId)
    .maybeSingle();

  return data?.instructor_id === actor.id;
}

/** Resolves the course that owns a lesson, for permission checks on lesson writes. */
export async function courseIdForLesson(lessonId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lessons")
    .select("modules!lessons_module_id_fkey (course_id)")
    .eq("id", lessonId)
    .maybeSingle();
  const modules = data?.modules as any;
  return modules?.course_id ?? null;
}
