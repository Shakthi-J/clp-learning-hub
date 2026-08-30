import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
function load(p){let r;try{r=readFileSync(p,"utf8")}catch{return}
for(const l of r.split(/\r?\n/)){const t=l.trim();if(!t||t.startsWith("#"))continue;const e=t.indexOf("=");if(e<0)continue;const k=t.slice(0,e).trim();let v=t.slice(e+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);if(!(k in process.env))process.env[k]=v}}
load(".env.local");
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const { data } = await sb.from("enrollments").select("id, patient_id, course_id, status, enrolled_at, courses(title), patients(email)").order("enrolled_at");
const groups = {};
for (const e of data) {
  const k = `${e.patient_id}|${e.course_id}`;
  (groups[k] ||= []).push(e);
}
console.log(`total enrollments: ${data.length}\n`);
for (const [k, rows] of Object.entries(groups)) {
  const active = rows.filter(r => r.status === "active");
  const flag = active.length > 1 ? "  <-- DUPLICATE ACTIVE" : "";
  console.log(`${rows[0].courses?.title} / ${rows[0].patients?.email}: ${rows.length} row(s), ${active.length} active${flag}`);
  for (const r of rows) console.log(`    ${r.status.padEnd(10)} ${r.enrolled_at}  ${r.id}`);
}
