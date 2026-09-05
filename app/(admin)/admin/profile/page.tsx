import { getActor } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppearanceCard, DisplayNameCard, PasswordCard } from "@/components/AccountSettings";

export const metadata = { title: "Profile" };

export default async function AdminProfilePage() {
  const actor = await getActor();
  if (!actor) redirect("/login");

  return (
    <div className="p-5 sm:p-6 md:p-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>Profile</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-secondary)" }}>
          Your account and how the hub looks to you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 items-start">
        <div className="space-y-6">
      <div className="card p-6 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
          style={{ background: "var(--primary)", color: "var(--on-primary)" }}
        >
          {(actor.name || actor.email || "A")[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold" style={{ color: "var(--foreground)" }}>{actor.name || "Admin"}</p>
          <p className="text-sm truncate" style={{ color: "var(--foreground-secondary)" }}>{actor.email}</p>
          <span
            className="inline-block mt-2 text-[11px] font-semibold px-2 py-1 rounded-full"
            style={{ background: "var(--accent-indigo-light)", color: "var(--accent-indigo)" }}
          >
            Admin
          </span>
        </div>
      </div>

          <DisplayNameCard currentName={actor.name || ""} />
          <PasswordCard recoveryHint="Forgot your current password? Sign out and use “Forgot your password?” on the sign-in page." />
        </div>

        <aside className="space-y-6">
          <AppearanceCard />
        </aside>
      </div>
    </div>
  );
}
