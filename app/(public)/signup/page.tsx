import Link from "next/link";
export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center  font-bold text-lg mx-auto mb-4" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>CL</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Account Creation</h1>
        <p className="text-sm mb-6" style={{ color: "var(--foreground-secondary)" }}>Accounts are created by CLP staff. Please contact your care team to get access.</p>
        <Link href="/login" className="inline-block px-6 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient">Go to Sign In</Link>
      </div>
    </div>
  );
}
