/**
 * Seeds admin / instructor / learner accounts plus demo course content.
 *
 *   node scripts/seed-accounts.mjs                 accounts + demo content
 *   node scripts/seed-accounts.mjs --skip-demo     accounts only
 *   node scripts/seed-accounts.mjs --reset-demo    delete demo courses, then reseed
 *
 * Passwords come from env vars (see .env.seed.example) so that no default
 * password is ever baked into the repo. Re-running updates existing accounts
 * instead of erroring, so this doubles as a password reset tool.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SKIP_DEMO = process.argv.includes("--skip-demo");
const RESET_DEMO = process.argv.includes("--reset-demo");

// --- Load .env.local without adding a dotenv dependency ---------------------
function loadEnvFile(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.seed");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Replace with your own unlisted YouTube IDs, or set SEED_DEMO_VIDEO_ID.
const DEMO_VIDEO_ID = process.env.SEED_DEMO_VIDEO_ID || "ZXNDF6XWFxE";

const accounts = [
  {
    label: "Admin",
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    name: process.env.SEED_ADMIN_NAME || "CLP Admin",
    role: "admin",
    access_type: "all_access",
  },
  {
    label: "Instructor",
    email: process.env.SEED_INSTRUCTOR_EMAIL,
    password: process.env.SEED_INSTRUCTOR_PASSWORD,
    name: process.env.SEED_INSTRUCTOR_NAME || "CLP Instructor",
    role: "instructor",
    access_type: "all_access",
  },
  {
    label: "Learner",
    email: process.env.SEED_LEARNER_EMAIL,
    password: process.env.SEED_LEARNER_PASSWORD,
    name: process.env.SEED_LEARNER_NAME || "Test Learner",
    role: "patient",
    access_type: process.env.SEED_LEARNER_ACCESS || "all_access",
  },
].filter((account) => account.email && account.password);

if (accounts.length === 0) {
  console.error("No accounts configured. Copy .env.seed.example to .env.seed and fill it in.");
  process.exit(1);
}

const weak = accounts.filter((a) => a.password.length < 8);
if (weak.length > 0) {
  console.error(`Password too short for: ${weak.map((a) => a.label).join(", ")} (minimum 8 characters)`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

/** Finds an existing auth user by email, paging through the admin list. */
async function findAuthUser(email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function seedAccount(account) {
  const existing = await findAuthUser(account.email);
  let userId;
  let created = false;

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: account.password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.name },
    });
    if (error) throw error;
    userId = data.user.id;
    created = true;
  }

  // A DB trigger usually creates the patients row on signup; handle both cases.
  const { data: patientRow } = await supabase
    .from("patients").select("id").eq("auth_user_id", userId).maybeSingle();

  let patientId;
  if (patientRow) {
    const { error } = await supabase
      .from("patients")
      .update({ name: account.name, role: account.role, access_type: account.access_type })
      .eq("id", patientRow.id);
    if (error) throw error;
    patientId = patientRow.id;
  } else {
    const { data, error } = await supabase.from("patients").insert({
      auth_user_id: userId,
      email: account.email,
      name: account.name,
      role: account.role,
      access_type: account.access_type,
    }).select("id").single();
    if (error) throw error;
    patientId = data.id;
  }

  return { created, patientId };
}

// ---------------------------------------------------------------------------
// Demo content
// ---------------------------------------------------------------------------

const DEMO_COURSES = [
  {
    slug: "gut-health-foundations",
    title: "Gut Health Foundations",
    category: "Digestive Health",
    description:
      "A practical introduction to the gut microbiome: what lives there, what it does for you, and the everyday habits that shape it.",
    published: true,
    modules: [
      {
        title: "Understanding Your Gut",
        lessons: [
          {
            title: "What Is the Gut Microbiome?",
            slug: "what-is-the-gut-microbiome",
            notes: "An overview of the trillions of microbes living in your digestive tract and why they matter for daily health.",
            quiz: {
              title: "Microbiome Basics",
              questions: [
                {
                  question: "Roughly how many microbial cells live in the human gut?",
                  options: ["A few thousand", "About a million", "Tens of trillions", "Exactly one billion"],
                  correct_answer: "Tens of trillions",
                },
                {
                  question: "Which of these best describes a healthy gut microbiome?",
                  options: ["A single dominant species", "High diversity of species", "No bacteria at all", "Only probiotic supplements"],
                  correct_answer: "High diversity of species",
                },
              ],
            },
          },
          {
            title: "How Digestion Actually Works",
            slug: "how-digestion-actually-works",
            notes: "Follow a meal from the first bite through to the large intestine, and see where your microbes get involved.",
          },
        ],
      },
      {
        title: "Everyday Habits",
        lessons: [
          {
            title: "Fibre and Fermented Foods",
            slug: "fibre-and-fermented-foods",
            notes: "Which foods feed a healthy microbiome, and simple ways to add more of them to your week.",
            assignment: {
              title: "Your Three-Day Food Log",
              prompt:
                "Track everything you eat for three days. Note which meals included fibre-rich or fermented foods, and describe one realistic change you could make next week.",
            },
          },
          {
            title: "Sleep, Stress and Your Gut",
            slug: "sleep-stress-and-your-gut",
            notes: "The gut-brain axis explained, and why rest and stress management are digestive health tools.",
          },
        ],
      },
    ],
  },
  {
    slug: "sleep-and-recovery-basics",
    title: "Sleep and Recovery Basics",
    category: "Lifestyle",
    description:
      "Why sleep is the foundation of recovery, and how to build a wind-down routine that actually holds up on a busy week.",
    published: true,
    modules: [
      {
        title: "Building Better Sleep",
        lessons: [
          {
            title: "The Sleep Cycle Explained",
            slug: "the-sleep-cycle-explained",
            notes: "What happens across a night of sleep, and why waking mid-cycle leaves you groggy.",
          },
          {
            title: "Designing a Wind-Down Routine",
            slug: "designing-a-wind-down-routine",
            notes: "A repeatable evening routine you can adapt to shift work, travel, and late nights.",
          },
        ],
      },
    ],
  },
];

async function deleteDemoCourses() {
  const slugs = DEMO_COURSES.map((c) => c.slug);
  // Modules, lessons, quizzes and enrollments cascade from courses.
  const { error } = await supabase.from("courses").delete().in("slug", slugs);
  if (error) throw error;
  console.log(`  deleted  existing demo courses (${slugs.join(", ")})`);
}

async function seedCourse(spec, instructorId) {
  const { data: existing } = await supabase
    .from("courses").select("id").eq("slug", spec.slug).maybeSingle();

  if (existing) {
    // Keep instructor assignment current, but leave authored content alone.
    if (instructorId) {
      await supabase.from("courses").update({ instructor_id: instructorId }).eq("id", existing.id);
    }
    console.log(`  exists   course      ${spec.title}`);
    return existing.id;
  }

  const { data: course, error } = await supabase.from("courses").insert({
    slug: spec.slug,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    published: spec.published,
    instructor_id: instructorId || null,
  }).select("id").single();
  if (error) throw error;

  let moduleOrder = 1;
  for (const moduleSpec of spec.modules) {
    const { data: mod, error: modError } = await supabase.from("modules").insert({
      course_id: course.id,
      title: moduleSpec.title,
      order: moduleOrder++,
    }).select("id").single();
    if (modError) throw modError;

    let lessonOrder = 1;
    for (const lessonSpec of moduleSpec.lessons) {
      const { data: lesson, error: lessonError } = await supabase.from("lessons").insert({
        module_id: mod.id,
        title: lessonSpec.title,
        slug: lessonSpec.slug,
        order: lessonOrder++,
        youtube_video_id: DEMO_VIDEO_ID,
        notes: lessonSpec.notes || null,
      }).select("id").single();
      if (lessonError) throw lessonError;

      if (lessonSpec.quiz) {
        const { data: quiz, error: quizError } = await supabase.from("quizzes").insert({
          lesson_id: lesson.id,
          title: lessonSpec.quiz.title,
        }).select("id").single();
        if (quizError) throw quizError;

        for (const question of lessonSpec.quiz.questions) {
          const { error: qError } = await supabase.from("quiz_questions").insert({
            quiz_id: quiz.id,
            question: question.question,
            options: question.options,
            correct_answer: question.correct_answer,
          });
          if (qError) throw qError;
        }
      }

      if (lessonSpec.assignment) {
        const { error: aError } = await supabase.from("assignments").insert({
          lesson_id: lesson.id,
          title: lessonSpec.assignment.title,
          prompt: lessonSpec.assignment.prompt,
        });
        if (aError) throw aError;
      }
    }
  }

  console.log(`  created  course      ${spec.title}`);
  return course.id;
}

/** Gives the learner one active enrollment and one pending request, mirroring the real flow. */
async function seedEnrollments(learnerId, adminId, activeCourseId, pendingCourseId) {
  if (!learnerId) return;

  const { data: existingEnrollment } = await supabase
    .from("enrollments").select("id")
    .eq("patient_id", learnerId).eq("course_id", activeCourseId).maybeSingle();

  if (existingEnrollment) {
    console.log("  exists   enrollment  learner already enrolled");
  } else {
    // The approved request is written too, so the admin Enrollments page has history.
    const { data: request } = await supabase.from("enrollment_requests").insert({
      patient_id: learnerId,
      course_id: activeCourseId,
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId || null,
    }).select("id").maybeSingle();

    const { error } = await supabase.from("enrollments").insert({
      patient_id: learnerId,
      course_id: activeCourseId,
      status: "active",
    });
    if (error) throw error;
    console.log(`  created  enrollment  learner enrolled (request ${request ? "logged" : "skipped"})`);
  }

  if (!pendingCourseId) return;

  const { data: existingRequest } = await supabase
    .from("enrollment_requests").select("id")
    .eq("patient_id", learnerId).eq("course_id", pendingCourseId).maybeSingle();

  if (existingRequest) {
    console.log("  exists   request     pending request already present");
    return;
  }

  const { error } = await supabase.from("enrollment_requests").insert({
    patient_id: learnerId,
    course_id: pendingCourseId,
    status: "requested",
  });
  if (error) throw error;
  console.log("  created  request     pending request for admin to review");
}

async function seedDemoContent(patientIds) {
  if (RESET_DEMO) await deleteDemoCourses();

  const courseIds = [];
  for (const spec of DEMO_COURSES) {
    courseIds.push(await seedCourse(spec, patientIds.instructor));
  }

  await seedEnrollments(patientIds.patient, patientIds.admin, courseIds[0], courseIds[1]);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

console.log(`Seeding ${accounts.length} account(s) into ${SUPABASE_URL}\n`);

let failures = 0;
const patientIds = {};

for (const account of accounts) {
  try {
    const { created, patientId } = await seedAccount(account);
    patientIds[account.role] = patientId;
    console.log(`  ${created ? "created" : "updated"}  ${account.label.padEnd(11)} ${account.email}  (role: ${account.role})`);
  } catch (err) {
    failures++;
    console.error(`  FAILED   ${account.label.padEnd(11)} ${account.email}  - ${err.message}`);
  }
}

if (!SKIP_DEMO && failures === 0) {
  console.log("\nSeeding demo content\n");
  try {
    await seedDemoContent(patientIds);
  } catch (err) {
    failures++;
    console.error(`  FAILED   demo content - ${err.message}`);
  }
}

console.log(
  failures === 0
    ? "\nDone. Sign in at /login with the passwords from your .env.seed file."
    : `\nFinished with ${failures} failure(s).`
);
process.exit(failures === 0 ? 0 : 1);
