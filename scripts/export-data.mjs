/**
 * Dumps every application table to a single JSON file, ready for
 * import-data.mjs to load into a different Supabase project.
 *
 *   node scripts/export-data.mjs backup.json
 *
 * Reads the CURRENT project from .env.local. Auth users are listed too, but
 * only their email, role metadata and id - Supabase never exposes password
 * hashes through the API, so accounts must be recreated with fresh passwords
 * on the far side. See import-data.mjs.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const eq = line.indexOf("=");
  if (eq < 1 || line.startsWith("#")) continue;
  let v = line.slice(eq + 1).trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  process.env[line.slice(0, eq)] = v;
}

const out = process.argv[2] || "backup.json";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Parent before child, so import-data.mjs can insert straight down the list
// without tripping a foreign key.
export const TABLE_ORDER = [
  "patients",
  "courses",
  "modules",
  "lessons",
  "quizzes",
  "quiz_questions",
  "assessments",
  "assessment_questions",
  "assignments",
  "enrollment_requests",
  "enrollments",
  "lesson_progress",
  "quiz_attempts",
  "assignment_submissions",
  "certificates",
  "certificate_template",
  "course_reviews",
  "lesson_comments",
  "patient_course_access",
];

const data = {};
for (const table of TABLE_ORDER) {
  const { data: rows, error } = await db.from(table).select("*");
  if (error) {
    console.log("  " + table.padEnd(24) + "SKIPPED (" + error.message.slice(0, 50) + ")");
    continue;
  }
  data[table] = rows;
  console.log("  " + table.padEnd(24) + rows.length);
}

const { data: authList, error: authError } = await db.auth.admin.listUsers();
if (authError) {
  console.error("Could not list auth users: " + authError.message);
  process.exit(1);
}
const authUsers = authList.users.map((u) => ({
  id: u.id,
  email: u.email,
  email_confirmed: !!u.email_confirmed_at,
  user_metadata: u.user_metadata ?? {},
}));
console.log("  auth users             " + authUsers.length);

writeFileSync(
  out,
  JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      source_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      auth_users: authUsers,
      tables: data,
    },
    null,
    2
  )
);

console.log("\nWritten to " + out);
console.log("Passwords are NOT in this file and cannot be exported - accounts get new ones on import.");
