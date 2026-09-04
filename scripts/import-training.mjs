/**
 * Bulk-creates staff training modules and lessons from a JSON definition,
 * resolving Google Drive filenames to file ids - the same idea as
 * import-courses.mjs, aimed at training_modules/training_lessons instead.
 *
 *   node scripts/import-training.mjs content/training.json            # dry run
 *   node scripts/import-training.mjs content/training.json --apply    # write
 *
 * Safe to re-run: a module or lesson already present (matched on title within
 * its parent) is left alone. New modules and lessons are numbered after
 * whatever already exists, so re-running never interleaves with prior runs.
 *
 * A lesson with no "video" field is written with no video - some of this
 * content is process notes with nothing to attach.
 */
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const eq = line.indexOf("=");
  if (eq < 1 || line.startsWith("#")) continue;
  let v = line.slice(eq + 1).trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  process.env[line.slice(0, eq)] = v;
}

const [, , definitionPath, ...flags] = process.argv;
const APPLY = flags.includes("--apply");

if (!definitionPath) {
  console.error("usage: node scripts/import-training.mjs <definition.json> [--apply]");
  process.exit(1);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function driveToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.split(String.raw`\n`).join("\n");
  if (!email || !key) return null;
  const b64 = (i) =>
    Buffer.from(i).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const url = "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const header = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64(JSON.stringify({
    iss: email, scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: url, iat: now, exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(header + "." + claim);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: header + "." + claim + "." + b64(signer.sign(key)),
    }),
  });
  if (!res.ok) throw new Error("Drive token failed: " + (await res.text()));
  return (await res.json()).access_token;
}

// The video folder's id, not a global search - see import-courses.mjs for why:
// Drive's general search index lags behind reality by several minutes; a
// direct parent-folder query does not.
const VIDEO_FOLDER_ID = process.env.GOOGLE_DRIVE_VIDEO_FOLDER_ID || "1boFXbSm6VvaH0vq65ASN3f2uhtJnmmpI";

async function driveIndex() {
  const token = await driveToken();
  if (!token) return new Map();
  const index = new Map();
  let pageToken;
  do {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("fields", "nextPageToken,files(id,name,mimeType)");
    url.searchParams.set("pageSize", "200");
    url.searchParams.set("q", `'${VIDEO_FOLDER_ID}' in parents and trashed = false`);
    url.searchParams.set("includeItemsFromAllDrives", "true");
    url.searchParams.set("supportsAllDrives", "true");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    const data = await res.json();
    if (!res.ok) throw new Error("Drive list failed: " + JSON.stringify(data));
    for (const f of data.files || []) {
      if (f.mimeType?.startsWith("video/")) index.set(f.name.toLowerCase(), f.id);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return index;
}

const definition = JSON.parse(readFileSync(definitionPath, "utf8"));
const drive = await driveIndex();
console.log("Drive videos visible: " + drive.size);

const missing = [];
for (const mod of definition) {
  for (const lesson of mod.lessons || []) {
    if (!lesson.video) continue;
    if (!drive.has(lesson.video.toLowerCase())) {
      missing.push(mod.title + " / " + lesson.title + " -> " + lesson.video);
    }
  }
}
if (missing.length) {
  console.error("\nThese videos are not in Drive (or not shared with the service account):");
  for (const m of missing) console.error("  " + m);
  console.error("\nNothing was written. Fix the filenames or the sharing, then re-run.");
  process.exit(1);
}

let created = { modules: 0, lessons: 0 };
let skipped = { modules: 0, lessons: 0 };
let withoutVideo = 0;

for (const mod of definition) {
  const { data: existingModule } = await db
    .from("training_modules").select("id").eq("title", mod.title).maybeSingle();

  let moduleId = existingModule?.id;
  if (existingModule) {
    console.log("= module exists: " + mod.title);
    skipped.modules++;
  } else {
    const { data: last } = await db
      .from("training_modules").select("order").order("order", { ascending: false }).limit(1).maybeSingle();
    const order = (last?.order ?? 0) + 1;
    console.log("+ module: " + mod.title);
    created.modules++;
    if (APPLY) {
      const { data, error } = await db.from("training_modules").insert({ title: mod.title, order }).select("id").single();
      if (error) { console.error("  failed: " + error.message); process.exit(1); }
      moduleId = data.id;
    }
  }

  let lessonOrder = 0;
  if (moduleId) {
    const { data: last } = await db
      .from("training_lessons").select("order").eq("module_id", moduleId)
      .order("order", { ascending: false }).limit(1).maybeSingle();
    lessonOrder = last?.order ?? 0;
  }

  for (const lesson of mod.lessons || []) {
    lessonOrder++;
    const driveFileId = lesson.video ? drive.get(lesson.video.toLowerCase()) : null;
    if (lesson.video && !driveFileId) withoutVideo++;

    let exists = false;
    if (moduleId) {
      const { data } = await db
        .from("training_lessons").select("id").eq("module_id", moduleId).eq("title", lesson.title).maybeSingle();
      exists = !!data;
    }

    if (exists) {
      console.log("  = lesson exists: " + lesson.title);
      skipped.lessons++;
      continue;
    }

    console.log("  + lesson: " + lesson.title + (driveFileId ? "  [video]" : "  [no video]"));
    created.lessons++;
    if (!driveFileId) withoutVideo++;
    if (APPLY) {
      const { error } = await db.from("training_lessons").insert({
        module_id: moduleId,
        title: lesson.title,
        order: lessonOrder,
        drive_file_id: driveFileId,
        notes: lesson.notes ?? null,
      });
      if (error) { console.error("    failed: " + error.message); process.exit(1); }
    }
  }
}

console.log(
  "\n" + (APPLY ? "Created" : "Would create") +
  ": " + created.modules + " modules, " + created.lessons + " lessons"
);
console.log("Already present: " + skipped.modules + " modules, " + skipped.lessons + " lessons");
console.log("Lessons with no video attached: " + withoutVideo);
if (!APPLY) console.log("\nDry run. Re-run with --apply to write.");
