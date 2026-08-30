"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({ currentName }: { currentName: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(currentName);
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

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
    // Supabase updates the password for the currently signed-in session.
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

  const inputStyle = {
    borderColor: "var(--border)",
    background: "var(--background)",
    color: "var(--foreground)",
  };

  return (
    <div className="space-y-6 pt-6 border-t" style={{ borderColor: "var(--border-light)" }}>
      <div>
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
            className="text-sm font-semibold px-4 py-2.5 rounded-xl text-white disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {savingName ? "Saving…" : "Save"}
          </button>
        </div>
        {nameMessage && (
          <p className="text-xs mt-2" style={{ color: nameMessage.type === "ok" ? "var(--success)" : "var(--danger)" }}>
            {nameMessage.text}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
          Change password
        </label>
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
