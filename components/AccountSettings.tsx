"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./ThemeToggle";

const inputStyle = {
  borderColor: "var(--border)",
  background: "var(--background)",
  color: "var(--foreground)",
};

type Message = { type: "ok" | "err"; text: string } | null;

function Note({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <p className="text-xs mt-2" style={{ color: message.type === "ok" ? "var(--success)" : "var(--danger)" }}>
      {message.text}
    </p>
  );
}

/** Colour theme. Separate so a page can sit it beside other content. */
export function AppearanceCard() {
  return (
    <div className="card p-6">
      <h2 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Appearance</h2>
      <p className="text-sm mb-4" style={{ color: "var(--foreground-secondary)" }}>
        System follows your device setting and changes with it.
      </p>
      <ThemeToggle />
    </div>
  );
}

/** Display name, saved through /api/profile so it is scoped to the signed-in row. */
export function DisplayNameCard({
  currentName,
  nameHelp,
}: {
  currentName: string;
  nameHelp?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: "err", text: data.message || "Could not save" });
      return;
    }
    setMessage({ type: "ok", text: "Name updated." });
    router.refresh();
  };

  return (
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
          className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl border text-sm"
          style={inputStyle}
        />
        <button
          onClick={save}
          disabled={saving || !name.trim() || name === currentName}
          className="text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60"
          style={{ background: "var(--primary)", color: "var(--on-primary)" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {nameHelp && <p className="text-[11px] mt-1.5" style={{ color: "var(--foreground-muted)" }}>{nameHelp}</p>}
      <Note message={message} />
    </div>
  );
}

/** Password change. Goes through Supabase on the client session, so the
 *  plaintext never reaches our server. */
export function PasswordCard({ recoveryHint }: { recoveryHint?: string }) {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const save = async () => {
    if (password.length < 8) {
      setMessage({ type: "err", text: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "err", text: "Passwords do not match." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return;
    }
    setPassword("");
    setConfirm("");
    setMessage({ type: "ok", text: "Password changed." });
  };

  return (
    <div className="card p-6">
      <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Password</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      {recoveryHint && (
        <p className="text-[11px] mt-2" style={{ color: "var(--foreground-muted)" }}>{recoveryHint}</p>
      )}
      <Note message={message} />
      <button
        onClick={save}
        disabled={saving || !password || !confirm}
        className="mt-3 text-sm font-semibold px-4 py-2.5 rounded-xl border disabled:opacity-60"
        style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}
      >
        {saving ? "Updating…" : "Update password"}
      </button>
    </div>
  );
}

/** All three stacked, for pages that do not need a custom arrangement. */
export default function AccountSettings({
  currentName,
  nameHelp,
  recoveryHint,
}: {
  currentName: string;
  nameHelp?: string;
  recoveryHint?: string;
}) {
  return (
    <div className="space-y-6">
      <AppearanceCard />
      <DisplayNameCard currentName={currentName} nameHelp={nameHelp} />
      <PasswordCard recoveryHint={recoveryHint} />
    </div>
  );
}
