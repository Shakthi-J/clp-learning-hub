/**
 * Bulk-creates courses, modules and lessons from a JSON definition, resolving
 * Google Drive filenames to file ids along the way.
 *
 *   node scripts/import-courses.mjs content/courses.json            # dry run
 *   node scripts/import-courses.mjs content/courses.json --apply    # write
 *
 * Safe to re-run: anything that already exists (matched on slug within its
 * parent) is left alone rather than duplicated, so you can add a lesson to the
 * definition and run it again.
 *
 * Every Drive filename must resolve before anything is written - a typo stops
 * the run instead of quietly creating a lesson with no video.
 */
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// ---------- env ----------

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
  console.error("usage: node scripts/import-courses.mjs <definition.json> [--apply]");
  process.exit(1);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ---------- drive ----------

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

/** filename -> file id for every video the service account can reach. */
// The video folder's id, not a global search. Drive's general files.list
// search index lags noticeably behind reality - a file can be confirmed
// present by querying its parent directly while the same file is invisible
// to an unscoped "trashed = false" search for several minutes. Querying by
// parent avoids that index entirely and reflects the folder's real contents.
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

// ---------- helpers ----------

const slugify = (s) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const definition = JSON.parse(readFileSync(definitionPath, "utf8"));
const drive = await driveIndex();
console.log("Drive videos visible: " + drive.size);

// Resolve every video reference first. Nothing is written until they all pass.
const missing = [];
for (const course of definition) {
  for (const mod of course.modules || []) {
    for (const lesson of mod.lessons || []) {
      if (!lesson.video) continue;
      if (!drive.has(lesson.video.toLowerCase())) {
        missing.push(course.title + " / " + mod.title + " / " + lesson.title + " -> " + lesson.video);
      }
    }
  }
}
if (missing.length) {
  console.error("\nThese videos are not in Drive (or not shared with the service account):");
  for (const m of missing) console.error("  " + m);
  console.error("\nNothing was written. Fix the filenames or the sharing, then re-run.");
  process.exit(1);
}

// Instructor lookup by email, so the definition never carries a uuid.
const instructorIds = new Map();
for (const course of definition) {
  if (!course.instructor || instructorIds.has(course.instructor)) continue;
  const { data } = await db
    .from("patients").select("id").eq("email", course.instructor).maybeSingle();
  if (!data) {
    console.error("No account for instructor " + course.instructor);
    process.exit(1);
  }
  instructorIds.set(course.instructor, data.id);
}

// ---------- import ----------

let created = { courses: 0, modules: 0, lessons: 0 };
let skipped = { courses: 0, modules: 0, lessons: 0 };

for (const course of definition) {
  const courseSlug = course.slug || slugify(course.title);
  let { data: existingCourse } = await db
    .from("courses").select("id, title").eq("slug", courseSlug).maybeSingle();

  let courseId = existingCourse?.id;
  if (existingCourse) {
    console.log("= course exists: " + course.title);
    skipped.courses++;
  } else {
    console.log("+ course: " + course.title);
    created.courses++;
    if (APPLY) {
      const { data, error } = await db.from("courses").insert({
        title: course.title,
        slug: courseSlug,
        description: course.description ?? null,
        category: course.category ?? null,
        published: course.published ?? true,
        instructor_id: course.instructor ? instructorIds.get(course.instructor) : null,
      }).select("id").single();
      if (error) { console.error("  failed: " + error.message); process.exit(1); }
      courseId = data.id;
    }
  }

  // Continue numbering after whatever the course already holds. Restarting at
  // 1 would collide with existing modules and interleave the new ones among
  // them in an order nobody chose.
  let moduleOrder = 0;
  if (courseId) {
    const { data: last } = await db
      .from("modules").select("order").eq("course_id", courseId)
      .order("order", { ascending: false }).limit(1).maybeSingle();
    moduleOrder = last?.order ?? 0;
  }

  for (const mod of course.modules || []) {
    moduleOrder++;

    let moduleId = null;
    if (courseId) {
      const { data: existingModule } = await db
        .from("modules").select("id").eq("course_id", courseId).eq("title", mod.title).maybeSingle();
      moduleId = existingModule?.id ?? null;
    }

    if (moduleId) {
      console.log("  = module exists: " + mod.title);
      skipped.modules++;
    } else {
      console.log("  + module: " + mod.title);
      created.modules++;
      if (APPLY) {
        const { data, error } = await db.from("modules").insert({
          course_id: courseId, title: mod.title, order: moduleOrder,
        }).select("id").single();
        if (error) { console.error("    failed: " + error.message); process.exit(1); }
        moduleId = data.id;
      }
    }

    // Same reasoning as modules: append after any lessons already in place.
    let lessonOrder = 0;
    if (moduleId) {
      const { data: last } = await db
        .from("lessons").select("order").eq("module_id", moduleId)
        .order("order", { ascending: false }).limit(1).maybeSingle();
      lessonOrder = last?.order ?? 0;
    }

    for (const lesson of mod.lessons || []) {
      lessonOrder++;
      const lessonSlug = lesson.slug || slugify(lesson.title);
      const driveFileId = lesson.video ? drive.get(lesson.video.toLowerCase()) : null;

      let exists = false;
      if (moduleId) {
        const { data } = await db
          .from("lessons").select("id").eq("module_id", moduleId).eq("slug", lessonSlug).maybeSingle();
        exists = !!data;
      }

      if (exists) {
        console.log("    = lesson exists: " + lesson.title);
        skipped.lessons++;
        continue;
      }

      console.log("    + lesson: " + lesson.title + (lesson.video ? "  [" + lesson.video + "]" : "  [no video]"));
      created.lessons++;
      if (APPLY) {
        const { error } = await db.from("lessons").insert({
          module_id: moduleId,
          title: lesson.title,
          slug: lessonSlug,
          order: lessonOrder,
          drive_file_id: driveFileId,
          notes: lesson.notes ?? null,
        });
        if (error) { console.error("      failed: " + error.message); process.exit(1); }
      }
    }
  }
}

console.log(
  "\n" + (APPLY ? "Created" : "Would create") +
  ": " + created.courses + " courses, " + created.modules + " modules, " + created.lessons + " lessons"
);
console.log(
  "Already present: " + skipped.courses + " courses, " + skipped.modules + " modules, " + skipped.lessons + " lessons"
);
if (!APPLY) console.log("\nDry run. Re-run with --apply to write.");
