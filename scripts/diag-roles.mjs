import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
function load(p){let r;try{r=readFileSync(p,"utf8")}catch{return}
for(const l of r.split(/\r?\n/)){const t=l.trim();if(!t||t.startsWith("#"))continue;const e=t.indexOf("=");if(e<0)continue;const k=t.slice(0,e).trim();let v=t.slice(e+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);if(!(k in process.env))process.env[k]=v}}
load(".env.local"); load(".env.seed");
const url=process.env.NEXT_PUBLIC_SUPABASE_URL, anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const roles = [
  ["ADMIN",      process.env.SEED_ADMIN_EMAIL,      process.env.SEED_ADMIN_PASSWORD],
  ["INSTRUCTOR", process.env.SEED_INSTRUCTOR_EMAIL, process.env.SEED_INSTRUCTOR_PASSWORD],
  ["LEARNER",    process.env.SEED_LEARNER_EMAIL,    process.env.SEED_LEARNER_PASSWORD],
];

for (const [label, email, password] of roles) {
  const a = createClient(url, anon, { auth: { persistSession: false } });
  const { data: s, error } = await a.auth.signInWithPassword({ email, password });
  if (error) { console.log(`\n${label}: SIGN-IN FAILED - ${error.message}`); continue; }
  const u = createClient(url, anon, { auth:{persistSession:false},
    global:{ headers:{ Authorization:`Bearer ${s.session.access_token}` } } });
  console.log(`\n${label} (${email})`);
  const checks = [
    ["patients",              u.from("patients").select("id,name,role")],
    ["courses",               u.from("courses").select("id,title")],
    ["modules",               u.from("modules").select("id")],
    ["lessons",               u.from("lessons").select("id")],
    ["enrollments",           u.from("enrollments").select("id,status")],
    ["enrollment_requests",   u.from("enrollment_requests").select("id,status")],
    ["quizzes",               u.from("quizzes").select("id")],
    ["quiz_questions",        u.from("quiz_questions").select("id")],
    ["assignments",           u.from("assignments").select("id")],
    ["assignment_submissions",u.from("assignment_submissions").select("id")],
    ["certificates",          u.from("certificates").select("id")],
    ["course_reviews",        u.from("course_reviews").select("id")],
    ["lesson_comments",       u.from("lesson_comments").select("id")],
  ];
  for (const [name, q] of checks) {
    const { data, error } = await q;
    console.log(`  ${name.padEnd(23)} ${error ? "ERROR: " + error.message : (data?.length ?? 0) + " rows"}`);
  }
}
