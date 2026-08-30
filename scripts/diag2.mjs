import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
function load(p){let r;try{r=readFileSync(p,"utf8")}catch{return}
for(const l of r.split(/\r?\n/)){const t=l.trim();if(!t||t.startsWith("#"))continue;const e=t.indexOf("=");if(e<0)continue;const k=t.slice(0,e).trim();let v=t.slice(e+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);if(!(k in process.env))process.env[k]=v}}
load(".env.local"); load(".env.seed");
const url=process.env.NEXT_PUBLIC_SUPABASE_URL, anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const auth=createClient(url,anon,{auth:{persistSession:false}});
const { data: sess } = await auth.auth.signInWithPassword({email:process.env.SEED_LEARNER_EMAIL,password:process.env.SEED_LEARNER_PASSWORD});
const u=createClient(url,anon,{auth:{persistSession:false},global:{headers:{Authorization:`Bearer ${sess.session.access_token}`}}});
for (const fn of ["current_patient_id","current_user_role","is_staff","is_admin"]) {
  const { data, error } = await u.rpc(fn);
  console.log(`  ${fn.padEnd(20)} ${error ? "ERROR: " + error.message : JSON.stringify(data)}`);
}
console.log("\ndirect select on patients:");
const { error: e1 } = await u.from("patients").select("id").limit(1);
console.log("  ", e1 ? "ERROR: " + e1.message : "ok");
