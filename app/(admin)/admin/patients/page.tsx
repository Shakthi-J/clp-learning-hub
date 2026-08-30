"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
type Patient = { id: string; name: string; email: string; access_type: string; role: string; created_at: string };
export default function AdminPatientsPage() {
  const supabase = createClient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [accessType, setAccessType] = useState("single_course");
  const [roleError, setRoleError] = useState("");
  const [submitting, setSubmitting] = useState(false); const [formError, setFormError] = useState(""); const [formSuccess, setFormSuccess] = useState("");
  const fetchPatients = async () => {
    setLoading(true);
    const { data } = await supabase.from("patients").select("id, name, email, access_type, role, created_at").in("role", ["patient", "instructor"]).order("created_at", { ascending: false });
    setPatients(data || []); setLoading(false);
  };
  useEffect(() => { fetchPatients(); }, []);
  const handleCreate = async () => {
    if (!name || !email || !password) return;
    setSubmitting(true); setFormError(""); setFormSuccess("");
    const res = await fetch("/api/patients/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password, access_type: accessType }) });
    const data = await res.json(); setSubmitting(false);
    if (!res.ok) { setFormError(data.message || "Something went wrong."); return; }
    setFormSuccess(`Account created for ${name}.`); setName(""); setEmail(""); setPassword(""); setAccessType("single_course"); setShowForm(false); fetchPatients();
  };
  const handleAccessTypeChange = async (patientId: string, newType: string) => {
    await supabase.from("patients").update({ access_type: newType }).eq("id", patientId); fetchPatients();
  };
  const handleRoleChange = async (patientId: string, newRole: string) => {
    setRoleError("");
    const res = await fetch(`/api/patients/${patientId}/role`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) { const data = await res.json().catch(() => ({})); setRoleError(data.message || "Could not change role"); return; }
    fetchPatients();
  };
  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Patients</h1><p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>Create accounts, set roles and access tiers</p></div>
        <button onClick={() => { setShowForm(!showForm); setFormError(""); setFormSuccess(""); }} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient">{showForm ? "Cancel" : "+ Add Patient"}</button>
      </div>
      {roleError && <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>{roleError}</div>}
      {formSuccess && <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: "var(--success-light)", color: "var(--success)" }}>{formSuccess}</div>}
      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold mb-5" style={{ color: "var(--foreground)" }}>Create New Patient Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {[{ label: "Full Name", val: name, set: setName, type: "text", ph: "Sarah Johnson" }, { label: "Email Address", val: email, set: setEmail, type: "email", ph: "sarah@example.com" }, { label: "Password", val: password, set: setPassword, type: "password", ph: "Min. 6 characters" }].map((f) => (
              <div key={f.label}><label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>{f.label}</label>
                <input type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} /></div>
            ))}
            <div><label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Access Type</label>
              <select value={accessType} onChange={(e) => setAccessType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}>
                <option value="single_course">Single Course</option><option value="all_access">All Access</option>
              </select></div>
          </div>
          {formError && <p className="text-xs mb-3" style={{ color: "var(--danger)" }}>{formError}</p>}
          <button onClick={handleCreate} disabled={submitting || !name || !email || !password} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60">{submitting ? "Creating..." : "Create Account"}</button>
        </div>
      )}
      {loading ? <div className="text-sm" style={{ color: "var(--foreground-muted)" }}>Loading...</div> : patients.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <span className="text-4xl block mb-3">👥</span><h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>No patients yet</h3>
          <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>Click &quot;Add Patient&quot; to create the first account.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--card-secondary)" }}>
              {["Name","Email","Role","Access","Joined"].map((h) => <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: "var(--foreground-secondary)" }}>{h}</th>)}
            </tr></thead>
            <tbody>{patients.map((patient, i) => (
              <tr key={patient.id} className="border-b" style={{ borderColor: "var(--border-light)", background: i % 2 === 0 ? "var(--card)" : "var(--background)" }}>
                <td className="px-5 py-3 font-medium" style={{ color: "var(--foreground)" }}>{patient.name || "—"}</td>
                <td className="px-5 py-3" style={{ color: "var(--foreground-secondary)" }}>{patient.email}</td>
                <td className="px-5 py-3"><select value={patient.role} onChange={(e) => handleRoleChange(patient.id, e.target.value)} className="text-xs px-2 py-1 rounded-lg border"
                  style={{ borderColor: "var(--border)", background: patient.role === "instructor" ? "var(--secondary-light)" : "var(--card)", color: "var(--foreground-secondary)" }}>
                  <option value="patient">Patient</option><option value="instructor">Instructor</option>
                </select></td>
                <td className="px-5 py-3"><select value={patient.access_type} onChange={(e) => handleAccessTypeChange(patient.id, e.target.value)} className="text-xs px-2 py-1 rounded-lg border"
                  style={{ borderColor: "var(--border)", background: patient.access_type === "all_access" ? "var(--primary-light)" : "var(--beige-light)", color: patient.access_type === "all_access" ? "var(--primary)" : "var(--foreground-secondary)" }}>
                  <option value="single_course">Single Course</option><option value="all_access">All Access</option>
                </select></td>
                <td className="px-5 py-3 text-xs" style={{ color: "var(--foreground-muted)" }}>{new Date(patient.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
