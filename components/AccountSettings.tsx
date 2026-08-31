"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./ThemeToggle";

/**
 * The settings every signed-in person has, whatever their role: display name,
 * password, and colour theme. Role-specific content lives on the page around it.
 */
export default function AccountSettings({
  currentName,
  /** Instructors credited on their own courses may still rename themselves. */
  nameHelp,
}: {
  currentName: string;
  nameHelp?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(currentName);
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const inputStyle = {
    borderColor: "var(--border)",
    background: "var(--background)",
    color: "var(--foreground)",
  };

  const saveName = async () => {
    setSavingName(true);
    setNameMessage(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSavingName(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setNameMessage({ type: "err", text: data.message || "Could not save" });
      return;
    }
    setNameMessage({ type: "ok", text: "Name updated." });
    router.refresh();
  };

  const savePassword = async () => {
    if (password.length < 8) {
      setPasswordMessage({ type: "err", text: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setPasswordMessage({ type: "err", text: "Passwords do not match." });
      return;
    }
    setSavingPassword(true);
    setPasswordMessage(null);
    // Supabase changes the password for the signed-in session, so the plaintext
    // never reaches our server.
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) {
      setPasswordMessage({ type: "err", text: error.message });
      return;
    }
    setPassword("");
    setConfirm("");
    setPasswordMessage({ type: "ok", text: "Password changed." });
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Appearance</h2>
        <p className="text-sm mb-4" style={{ color: "var(--foreground-secondary)" }}>
          System follows your device setting and changes with it.
        </p>
        <ThemeToggle />
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Your details</h2>

        <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
          Display name
        </label>
        <div className="flex gap-2 flex-wrap">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border text-sm"
            style={inputStyle}
          />
          <button
            onClick={saveName}
            disabled={savingName || !name.trim() || name === currentName}
            className="text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60"
            style={{ background: "var(--primary)", color: "var(--on-primary)" }}
          >
            {savingName ? "Saving…" : "Save"}
          </button>
        </div>
        {nameHelp && (
          <p className="text-[11px] mt-1.5" style={{ color: "var(--foreground-muted)" }}>{nameHelp}</p>
        )}
        {nameMessage && (
          <p className="text-xs mt-2" style={{ color: nameMessage.type === "ok" ? "var(--success)" : "var(--danger)" }}>
            {nameMessage.text}
          </p>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Password</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            className="px-4 py-2.5 rounded-xl border text-sm"
            style={inputStyle}
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            className="px-4 py-2.5 rounded-xl border text-sm"
            style={inputStyle}
          />
        </div>
        {passwordMessage && (
          <p className="text-xs mt-2" style={{ color: passwordMessage.type === "ok" ? "var(--success)" : "var(--danger)" }}>
            {passwordMessage.text}
          </p>
        )}
        <button
          onClick={savePassword}
          disabled={savingPassword || !password || !confirm}
          className="mt-3 text-sm font-semibold px-4 py-2.5 rounded-xl border disabled:opacity-60"
          style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
        >
          {savingPassword ? "Updating…" : "Update password"}
        </button>
      </div>
    </div>
  );
}
