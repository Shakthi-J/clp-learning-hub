/**
 * Loads a backup.json from export-data.mjs into a DIFFERENT Supabase project.
 *
 *   node scripts/import-data.mjs backup.json            # preflight only
 *   node scripts/import-data.mjs backup.json --apply    # write
 *
 * The target project is read from .env.migration:
 *
 *   TARGET_SUPABASE_URL=https://<new-ref>.supabase.co
 *   TARGET_SERVICE_ROLE_KEY=<new service role key>
 *
 * Run every migration in supabase/migrations/ on the target FIRST - this
 * script loads data, it does not create the schema.
 *
 * Passwords cannot be carried across: Supabase does not expose password
 * hashes. Each account is recreated with a freshly generated password, and
 * every credential is printed at the end for the admin to distribute.
 *
 * Row ids are preserved, so every foreign key inside the application data
 * still points where it did. The one exception is patients.auth_user_id,
 * which necessarily points at the new auth user.
 */
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  let text;
  try { text = readFileSync(path, "utf8"); } catch { return; }
  for (const line of text.split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq < 1 || line.startsWith("#")) continue;
    let v = line.slice(eq + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    process.env[line.slice(0, eq)] = v;
  }
}
loadEnv(".env.migration");

const [, , backupPath, ...flags] = process.argv;
const APPLY = flags.includes("--apply");

if (!backupPath) {
  console.error("usage: node scripts/import-data.mjs <backup.json> [--apply]");
  process.exit(1);
}

const url = process.env.TARGET_SUPABASE_URL;
const key = process.env.TARGET_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set TARGET_SUPABASE_URL and TARGET_SERVICE_ROLE_KEY in .env.migration");
  process.exit(1);
}

const backup = JSON.parse(readFileSync(backupPath, "utf8"));
if (backup.source_url && new URL(backup.source_url).host === new URL(url).host) {
  console.error("Target is the same project the backup came from. Refusing.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const TABLE_ORDER = Object.keys(backup.tables);

// Tables the migrations seed themselves. Their default row is expected to be
// present on a fresh project, and the exported row - which carries whatever
// the admin customised - replaces it rather than colliding with it.
const SEEDED = new Set(["certificate_template"]);

// ---------- preflight ----------

console.log("Target: " + url);
console.log("Backup taken: " + backup.exported_at + "\n");

let schemaOk = true;
let notEmpty = [];
for (const table of TABLE_ORDER) {
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
  if (error) {
    console.log("  " + table.padEnd(24) + "MISSING - run the migrations first");
    schemaOk = false;
    continue;
  }
  const incoming = backup.tables[table].length;
  const seeded = SEEDED.has(table) ? "  (seeded, will be replaced)" : "";
  console.log("  " + table.padEnd(24) + "target has " + count + ", backup has " + incoming + seeded);
  if (count && !SEEDED.has(table)) notEmpty.push(table);
}

if (!schemaOk) {
  console.error("\nThe target is missing tables. Run supabase/migrations/*.sql there, then re-run.");
  process.exit(1);
}
if (notEmpty.length) {
  console.error("\nThese target tables already hold rows: " + notEmpty.join(", "));
  console.error("Import expects an empty project. Clear it or use a fresh one.");
  process.exit(1);
}

if (!APPLY) {
  console.log("\nPreflight passed. Re-run with --apply to write.");
  process.exit(0);
}

// ---------- auth users ----------

const password = () => randomBytes(9).toString("base64").replace(/[+/=]/g, "") + "aA1!";
const authIdMap = new Map();
const credentials = [];

for (const user of backup.auth_users) {
  const pw = password();
  const { data, error } = await db.auth.admin.createUser({
    email: user.email,
    password: pw,
    email_confirm: true,
    user_metadata: user.user_metadata,
  });
  if (error) { console.error("createUser " + user.email + ": " + error.message); process.exit(1); }
  authIdMap.set(user.id, data.user.id);
  credentials.push({ email: user.email, password: pw });
  console.log("auth user created: " + user.email);
}

// A handle_new_user trigger inserts a patients row for each account above.
// Those rows carry fresh ids that nothing else references, so they are
// removed and replaced by the exported rows, which keep their original ids.
const { error: clearError } = await db
  .from("patients").delete().in("auth_user_id", [...authIdMap.values()]);
if (clearError) { console.error("clearing trigger rows: " + clearError.message); process.exit(1); }

// ---------- rows ----------

for (const table of TABLE_ORDER) {
  const rows = backup.tables[table];
  if (!rows.length) { console.log("  " + table.padEnd(24) + "0"); continue; }

  const prepared = table === "patients"
    ? rows.map((r) => ({ ...r, auth_user_id: authIdMap.get(r.auth_user_id) ?? null }))
    : rows;

  // A seeded singleton is replaced outright: the migration's default row
  // carries no customisation worth keeping.
  if (SEEDED.has(table)) {
    const { error: wipeError } = await db.from(table).delete().not("id", "is", null);
    if (wipeError) {
      console.error("clearing seeded " + table + " failed: " + wipeError.message);
      process.exit(1);
    }
  }

  const { error } = await db.from(table).insert(prepared);
  if (error) {
    console.error("\ninsert into " + table + " failed: " + error.message);
    console.error("Nothing after this table was written.");
    process.exit(1);
  }
  console.log("  " + table.padEnd(24) + rows.length);
}

// ---------- credentials ----------

console.log("\nNEW SIGN-IN CREDENTIALS - store these now, they are not recoverable:\n");
for (const c of credentials) {
  console.log("  " + c.email.padEnd(36) + c.password);
}
console.log("\nEach person should change their password after first sign-in.");
