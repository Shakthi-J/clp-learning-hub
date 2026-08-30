"use client";
import { useState } from "react";
import { PencilSimple, Key, X } from "@phosphor-icons/react";
import CourseAccessPicker from "@/components/CourseAccessPicker";

export type Person = {
  id: string;
  name: string;
  email: string;
  access_type: string;
  role: string;
  created_at: string;
};

/**
 * One person, with an inline panel for the things only an admin can change:
 * display name, sign-in email, access tier, role, and a password reset.
 */
export default function PersonRow({
  person,
  onChanged,
  actorRole,
  actorId,
}: {
  person: Person;
  onChanged: () => void;
  actorRole: string;
  actorId: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(person.name ?? "");
  const [email, setEmail] = useState(person.email ?? "");
  const [accessType, setAccessType] = useState(person.access_type);
  const [role, setRole] = useState(person.role);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const inputStyle = {
    borderColor: "var(--border)",
    background: "var(--background)",
    color: "var(--foreground)",
  };

  const saveProfile = async () => {
    setBusy(true);
    setMessage(null);

    // Role goes through its own endpoint, which refuses to strand an instructor's courses.
    if (role !== person.role) {
      const res = await fetch(`/api/patients/${person.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        setMessage({ type: "err", text: data.message || "Could not change role" });
        return;
      }
    }

    const res = await fetch(`/api/patients/${person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, access_type: accessType }),
    });
    setBusy(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: "err", text: data.message || "Could not save" });
      return;
    }
    setMessage({ type: "ok", text: "Saved." });
    onChanged();
  };

  const resetPassword = async () => {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/patients/${person.id}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: "err", text: data.message || "Could not reset password" });
      return;
    }
    setPassword("");
    setMessage({ type: "ok", text: `Password changed. Give it to ${person.name || person.email} directly.` });
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="font-medium" style={{ color: "var(--foreground)" }}>{person.name || "—"}</p>
          <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>{person.email}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-semibold px-2 py-1 rounded-full"
            style={
              person.role === "instructor"
                ? { background: "var(--accent-teal-light)", color: "var(--accent-teal)" }
                : { background: "var(--card-secondary)", color: "var(--foreground-secondary)" }
            }
          >
            {person.role === "instructor" ? "Instructor" : "Learner"}
          </span>
          {person.role === "patient" && (
            <span
              className="text-[11px] font-semibold px-2 py-1 rounded-full"
              style={
                person.access_type === "all_access"
                  ? { background: "var(--accent-indigo-light)", color: "var(--accent-indigo)" }
                  : person.access_type === "selected_courses"
                    ? { background: "var(--accent-blue-light)", color: "var(--accent-blue)" }
                    : { background: "var(--card-secondary)", color: "var(--foreground-secondary)" }
              }
            >
              {person.access_type === "all_access"
                ? "All Access"
                : person.access_type === "selected_courses"
                  ? "Selected Courses"
                  : "Single Course"}
            </span>
          )}
          <span className="text-xs hidden sm:inline" style={{ color: "var(--foreground-muted)" }}>
            {new Date(person.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <button
            onClick={() => { setOpen(!open); setMessage(null); }}
            className="text-xs font-semibold inline-flex items-center gap-1.5 ml-1"
            style={{ color: "var(--primary)" }}
          >
            {open ? <><X size={13} weight="bold" /> Close</> : <><PencilSimple size={13} weight="bold" /> Manage</>}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border-light)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Name</label>
                  <input value={name} maxLength={100} onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Sign-in email</label>
                  <input value={email} type="email" onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle} />
                  <p className="text-[11px] mt-1" style={{ color: "var(--foreground-muted)" }}>
                    Changing this changes the address they sign in with.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle}>
                      <option value="patient">Learner</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground)" }}>Access</label>
                    <select value={accessType} onChange={(e) => setAccessType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={inputStyle}>
                      <option value="single_course">Single Course</option>
                      <option value="selected_courses">Selected Courses</option>
                      <option value="all_access">All Access</option>
                    </select>
                  </div>
                </div>
                <button onClick={saveProfile} disabled={busy}
                  className="text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60"
                  style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
                  {busy ? "Saving…" : "Save changes"}
                </button>

                {role === "patient" && accessType === "selected_courses" && (
                  <div className="pt-4" style={{ borderTop: "1px solid var(--border-light)" }}>
                    <label className="block text-xs font-medium mb-2" style={{ color: "var(--foreground)" }}>
                      Courses for this learner
                    </label>
                    <p className="text-[11px] mb-2.5" style={{ color: "var(--foreground-muted)" }}>
                      {accessType !== person.access_type
                        ? "Save the tier change first, then pick their courses."
                        : "Assigning a course enrols them straight away."}
                    </p>
                    {accessType === person.access_type && (
                      <CourseAccessPicker patientId={person.id} actorRole={actorRole} actorId={actorId} />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 md:border-l md:pl-5" style={{ borderColor: "var(--border)" }}>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                    Set a new password
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="off"
                    className="w-full px-3 py-2 rounded-lg border text-sm font-mono"
                    style={inputStyle}
                  />
                  <p className="text-[11px] mt-1" style={{ color: "var(--foreground-muted)" }}>
                    Shown in plain text so you can pass it on. They can change it from their profile.
                  </p>
                </div>
                <button onClick={resetPassword} disabled={busy || password.length < 8}
                  className="text-sm font-semibold px-4 py-2 rounded-xl border inline-flex items-center gap-2 disabled:opacity-60"
                  style={{ borderColor: "var(--border)", color: "var(--foreground-secondary)" }}>
                  <Key size={14} weight="bold" /> Change password
                </button>
              </div>
            </div>

            {message && (
              <p className="text-xs mt-4" style={{ color: message.type === "ok" ? "var(--success)" : "var(--danger)" }}>
                {message.text}
              </p>
            )}
        </div>
      )}
    </div>
  );
}
