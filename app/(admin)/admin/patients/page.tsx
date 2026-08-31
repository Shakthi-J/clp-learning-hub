"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, UserPlus } from "@phosphor-icons/react";
import PersonRow, { type Person } from "./PersonRow";

export default function AdminPeoplePage() {
  const supabase = createClient();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [accessType, setAccessType] = useState("single_course");

  const [actor, setActor] = useState<{ id: string; role: string } | null>(null);
  const [authored, setAuthored] = useState<Record<string, number>>({});
  const [roleFilter, setRoleFilter] = useState<"all" | "patient" | "instructor">("all");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchPeople = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("patients")
      .select("id, name, email, access_type, role, created_at")
      .in("role", ["patient", "instructor"])
      .order("created_at", { ascending: false });
    setPeople((data as Person[]) || []);

    // How many courses each person wrote, so their credit can be protected.
    const { data: courseRows } = await supabase.from("courses").select("created_by");
    const counts: Record<string, number> = {};
    for (const row of (courseRows as any[]) || []) {
      if (row.created_by) counts[row.created_by] = (counts[row.created_by] ?? 0) + 1;
    }
    setAuthored(counts);
    setLoading(false);
  };

  useEffect(() => {
    fetchPeople();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("patients").select("id, role").eq("auth_user_id", user.id).maybeSingle();
      if (data) setActor({ id: data.id, role: data.role });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!name || !email || !password) return;
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    const res = await fetch("/api/patients/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, access_type: accessType }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) { setFormError(data.message || "Something went wrong."); return; }

    setFormSuccess(
      `${role === "instructor" ? "Instructor" : "Learner"} account created for ${name}. Pass the password on directly.`
    );
    setName(""); setEmail(""); setPassword(""); setRole("patient"); setAccessType("single_course");
    setShowForm(false);
    fetchPeople();
  };

  const inputStyle = { borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" };
  const instructors = people.filter((p) => p.role === "instructor").length;
  const learners = people.length - instructors;

  const visible = roleFilter === "all" ? people : people.filter((p) => p.role === roleFilter);

  const FILTERS: { value: typeof roleFilter; label: string; count: number }[] = [
    { value: "all", label: "Everyone", count: people.length },
    { value: "patient", label: "Learners", count: learners },
    { value: "instructor", label: "Instructors", count: instructors },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>People</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
            Every account on the hub. Create sign-ins, set who is an instructor, and manage access.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(""); setFormSuccess(""); }}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 primary-gradient"
        >
          <UserPlus size={16} weight="bold" /> {showForm ? "Cancel" : "Add person"}
        </button>
      </div>

      {formSuccess && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: "var(--success-light)", color: "var(--success)" }}>
          {formSuccess}
        </div>
      )}

      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold mb-5" style={{ color: "var(--foreground)" }}>Create an account</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Ramanathan"
                className="w-full px-4 py-2.5 rounded-xl border text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya@example.com"
                className="w-full px-4 py-2.5 rounded-xl border text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Password</label>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters" autoComplete="off"
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-mono" style={inputStyle} />
              <p className="text-[11px] mt-1" style={{ color: "var(--foreground-muted)" }}>
                You choose it and pass it on. They can change it later from their profile.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm" style={inputStyle}>
                <option value="patient">Learner</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
            {role === "patient" && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Access tier</label>
                <select value={accessType} onChange={(e) => setAccessType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm" style={inputStyle}>
                  <option value="single_course">Single Course</option>
                  <option value="selected_courses">Selected Courses</option>
                  <option value="all_access">All Access</option>
                </select>
              </div>
            )}
          </div>

          {formError && <p className="text-xs mb-3" style={{ color: "var(--danger)" }}>{formError}</p>}

          <button onClick={handleCreate} disabled={submitting || !name || !email || password.length < 8}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold primary-gradient disabled:opacity-60">
            {submitting ? "Creating…" : "Create account"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : people.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: "var(--accent-purple-light)", color: "var(--accent-purple)" }}>
            <Users size={22} weight="duotone" />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>No accounts yet</h3>
          <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>
            Add the first learner or instructor to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap mb-5">
            {FILTERS.map((f) => {
              const active = roleFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setRoleFilter(f.value)}
                  aria-pressed={active}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5"
                  style={
                    active
                      ? { background: "var(--primary)", borderColor: "var(--primary)", color: "var(--on-primary)" }
                      : { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground-secondary)" }
                  }
                >
                  {f.label}
                  <span className="font-mono" style={{ opacity: 0.7 }}>{f.count}</span>
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--foreground-muted)" }}>
              No {roleFilter === "instructor" ? "instructors" : "learners"} yet.
            </p>
          ) : (
          <div className="space-y-3 stagger">
            {visible.map((person) => (
              <PersonRow key={person.id} person={person} onChanged={fetchPeople} actorRole={actor?.role ?? "admin"} actorId={actor?.id ?? ""} authoredCourses={authored[person.id] ?? 0} />
            ))}
          </div>
          )}
        </>
      )}
    </div>
  );
}
