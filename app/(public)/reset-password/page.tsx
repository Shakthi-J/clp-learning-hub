"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeSlash } from "@phosphor-icons/react";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  // The recovery link signs the browser in via a one-time token in the URL;
  // Supabase fires PASSWORD_RECOVERY once that session lands. Until then the
  // link may be expired, already used, or just still loading - three
  // different messages so the reason is clear.
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });
    // A recovery session may already be established by the time this effect
    // runs (the event can fire before the listener attaches), so also check
    // directly rather than relying on the event alone.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus((s) => (s === "checking" ? "ready" : s));
    });
    const timeout = setTimeout(() => setStatus((s) => (s === "checking" ? "invalid" : s)), 4000);
    return () => { subscription.subscription.unsubscribe(); clearTimeout(timeout); };
  }, [supabase]);

  const save = async () => {
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setSaving(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mx-auto mb-3" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>CL</div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Choose a new password</h1>
        </div>
        <div className="card p-6">
          {status === "checking" && (
            <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>Verifying your reset link...</p>
          )}
          {status === "invalid" && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>This reset link is invalid or has expired. Request a new one from the sign-in page.</p>
          )}
          {status === "ready" && !done && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>New password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" className="w-full pl-4 pr-11 py-2.5 rounded-xl border text-sm"
                    style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-lg" style={{ color: "var(--foreground-muted)" }}>
                    {showPassword ? <EyeSlash size={17} weight="bold" /> : <Eye size={17} weight="bold" />}
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Confirm password</label>
                <input type={showPassword ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()}
                  placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
              </div>
              {error && <p className="text-xs mb-3" style={{ color: "var(--danger)" }}>{error}</p>}
              <button onClick={save} disabled={saving || !password || !confirm}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-sm primary-gradient disabled:opacity-60 disabled:cursor-not-allowed">
                {saving ? "Saving..." : "Set new password"}
              </button>
            </>
          )}
          {done && (
            <p className="text-sm" style={{ color: "var(--success)" }}>Password updated. Redirecting to sign in...</p>
          )}
        </div>
      </div>
    </div>
  );
}
