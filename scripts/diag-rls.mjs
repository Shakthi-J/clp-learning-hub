import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
function load(p){let r;try{r=readFileSync(p,"utf8")}catch{return}
for(const l of r.split(/\r?\n/)){const t=l.trim();if(!t||t.startsWith("#"))continue;const e=t.indexOf("=");if(e<0)continue;const k=t.slice(0,e).trim();let v=t.slice(e+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);if(!(k in process.env))process.env[k]=v}}
load(".env.local"); load(".env.seed");
const url=process.env.NEXT_PUBLIC_SUPABASE_URL, anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, svc=process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin=createClient(url,svc,{auth:{persistSession:false}});

const SUB="0fe75bce-18a7-47d0-902b-fd7e77102b37";
const { data: row } = await admin.from("patients").select("id, name, email, role, auth_user_id").eq("auth_user_id", SUB).maybeSingle();
console.log("service-role sees patients row:", row || "NONE");

const { data: enr } = await admin.from("enrollments").select("id, status, patient_id").eq("patient_id", row?.id ?? "x");
console.log("service-role sees enrollments:", enr?.length ?? 0);

// Now sign in as the learner to get a real user JWT, then read with anon key.
const auth = createClient(url, anon, { auth: { persistSession: false } });
const { data: sess, error: signErr } = await auth.auth.signInWithPassword({
  email: process.env.SEED_LEARNER_EMAIL, password: process.env.SEED_LEARNER_PASSWORD,
});
if (signErr) { console.log("sign-in failed:", signErr.message); process.exit(1); }
const asUser = createClient(url, anon, {
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${sess.session.access_token}` } },
});
for (const [label, q] of [
  ["patients (own row)", asUser.from("patients").select("id, name, role").eq("auth_user_id", SUB)],
  ["enrollments",        asUser.from("enrollments").select("id, status")],
  ["courses",            asUser.from("courses").select("id, title")],
  ["lessons",            asUser.from("lessons").select("id").limit(5)],
]) {
  const { data, error } = await q;
  console.log(`  ${label.padEnd(20)} ${error ? "ERROR: " + error.message : (data?.length ?? 0) + " rows"}`);
}
const { data: fn, error: fnErr } = await asUser.rpc("current_patient_id");
console.log("current_patient_id() as user:", fnErr ? "ERROR: " + fnErr.message : fn);
