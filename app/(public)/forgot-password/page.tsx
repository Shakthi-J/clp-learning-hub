"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    // Supabase only reveals whether the address is registered via timing, not
    // the response - so success is shown either way. This also means we never
    // learn here whether the email actually exists, which is the point.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mx-auto mb-3" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>CL</div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Reset your password</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>We&apos;ll email you a link to choose a new one.</p>
        </div>
        <div className="card p-6">
          {sent ? (
            <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>
              If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox (and spam folder) and follow the link to set a new password.
            </p>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="your@email.com" className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
              </div>
              {error && <p className="text-xs mb-3" style={{ color: "var(--danger)" }}>{error}</p>}
              <button onClick={submit} disabled={loading || !email}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-sm primary-gradient disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </>
          )}
        </div>
        <Link href="/login" className="block text-center text-xs mt-6" style={{ color: "var(--foreground-muted)" }}>Back to sign in</Link>
      </div>
    </div>
  );
}
