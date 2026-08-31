import { getActor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppearanceCard, DisplayNameCard, PasswordCard } from "@/components/AccountSettings";

export const metadata = { title: "Profile" };

export default async function InstructorProfilePage() {
  const actor = await getActor();
  if (!actor) redirect("/login");

  const supabase = await createClient();
  const { count: authored } = await supabase
    .from("courses").select("*", { count: "exact", head: true }).eq("created_by", actor.id);

  return (
    <div className="p-6 md:p-10 max-w-5xl">
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
          {(actor.name || actor.email || "I")[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold" style={{ color: "var(--foreground)" }}>{actor.name || "Instructor"}</p>
          <p className="text-sm truncate" style={{ color: "var(--foreground-secondary)" }}>{actor.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="text-[11px] font-semibold px-2 py-1 rounded-full"
              style={{ background: "var(--accent-teal-light)", color: "var(--accent-teal)" }}
            >
              Instructor
            </span>
            {(authored ?? 0) > 0 && (
              <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                <span className="font-mono">{authored}</span> course{authored !== 1 ? "s" : ""} written
              </span>
            )}
          </div>
        </div>
      </div>

          <DisplayNameCard
            currentName={actor.name || ""}
            nameHelp={
              (authored ?? 0) > 0
                ? "Your name is the credit on the courses you wrote, so only you can change it."
                : undefined
            }
          />
          <PasswordCard />
        </div>

        <aside className="space-y-6">
          <AppearanceCard />
        </aside>
      </div>
    </div>
  );
}
