import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  let raw; try { raw = readFileSync(path, "utf8"); } catch { return; }
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("="); if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnvFile(".env.local"); loadEnvFile(".env.seed");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log("URL:", url || "MISSING");
console.log("service key:", key ? `present (${key.length} chars)` : "MISSING");
console.log("anon key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "present" : "MISSING");
const seedVars = ["SEED_ADMIN_EMAIL","SEED_ADMIN_PASSWORD","SEED_INSTRUCTOR_EMAIL","SEED_INSTRUCTOR_PASSWORD","SEED_LEARNER_EMAIL","SEED_LEARNER_PASSWORD","SEED_DEMO_VIDEO_ID"];
console.log("\n.env.seed:");
for (const v of seedVars) {
  const val = process.env[v];
  const shown = v.includes("PASSWORD") ? (val ? `set (${val.length} chars)` : "EMPTY") : (val || "EMPTY");
  console.log(`  ${v.padEnd(26)} ${shown}`);
}
if (!url || !key) process.exit(1);

const sb = createClient(url, key, { auth: { persistSession: false } });
const tables = ["patients","courses","modules","lessons","enrollment_requests","enrollments","lesson_progress","certificates","quizzes","quiz_questions","quiz_attempts","assessments","assessment_questions","assessment_attempts","assignments","assignment_submissions","course_reviews","lesson_comments"];
console.log("\nTables:");
let missing = 0;
for (const t of tables) {
  const { error, count } = await sb.from(t).select("*", { count: "exact", head: true });
  if (error) { missing++; console.log(`  MISSING  ${t}  (${error.message})`); }
  else console.log(`  ok       ${t.padEnd(24)} ${count ?? 0} rows`);
}
const { error: colErr } = await sb.from("courses").select("instructor_id, avg_rating, review_count").limit(1);
console.log("\nMigration columns on courses:", colErr ? `MISSING (${colErr.message})` : "ok");
const { error: certErr } = await sb.from("certificates").select("certificate_number, issued_at").limit(1);
console.log("Migration columns on certificates:", certErr ? `MISSING (${certErr.message})` : "ok");
console.log(missing === 0 ? "\nSchema looks complete." : `\n${missing} table(s) missing - run the SQL files.`);
