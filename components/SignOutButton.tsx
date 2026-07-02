"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
export default function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();
  const handleSignOut = async () => { await supabase.auth.signOut(); router.push("/login"); router.refresh(); };
  return <button onClick={handleSignOut} className="w-full text-left text-xs px-3 py-2 rounded-lg" style={{ color: "var(--foreground-muted)" }}>Sign out</button>;
}
