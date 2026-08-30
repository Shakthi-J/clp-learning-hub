import Link from "next/link";
import {
  ArrowRight, Stethoscope, PlayCircle, SealCheck, ShieldCheck, Certificate, ChartLineUp,
} from "@phosphor-icons/react/ssr";
import { ButtonLink } from "@/components/ui/Button";

const STEPS = [
  {
    n: "01",
    title: "Request a course",
    body: "Browse the catalog and ask for the course you need. Nothing is paywalled, and there is no checkout.",
    icon: Stethoscope,
    accent: "blue",
  },
  {
    n: "02",
    title: "Your care team approves it",
    body: "A CLP clinician reviews the request against your care plan, usually the same day.",
    icon: ShieldCheck,
    accent: "teal",
  },
  {
    n: "03",
    title: "Learn at your own pace",
    body: "Short video lessons with notes, quizzes and a place to ask questions. Progress saves as you go.",
    icon: PlayCircle,
    accent: "purple",
  },
  {
    n: "04",
    title: "Earn a certificate",
    body: "Finish every lesson and your certificate is issued automatically, with a link anyone can verify.",
    icon: Certificate,
    accent: "amber",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Asymmetric hero: content left, a real product surface right. */}
      <section className="px-4 md:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
          <div className="rise">
            <span
              className="inline-flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-full mb-7"
              style={{ background: "var(--primary-light)", color: "var(--primary)" }}
            >
              <Stethoscope size={13} weight="fill" />
              Clinic Living Plus
            </span>

            <h1
              className="text-4xl md:text-5xl font-semibold tracking-tighter leading-[1.05] mb-6"
              style={{ color: "var(--foreground)" }}
            >
              Health education,
              <br />
              written by the clinicians
              <br />
              <span style={{ color: "var(--primary)" }}>who treat you.</span>
            </h1>

            <p
              className="text-base leading-relaxed max-w-[52ch] mb-9"
              style={{ color: "var(--foreground-secondary)" }}
            >
              Short video courses on gut health, sleep and recovery — prescribed by your care
              team, not an algorithm. Work through them at your own pace and keep the
              certificate at the end.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <ButtonLink href="/courses" size="lg" iconRight={<ArrowRight size={15} weight="bold" />}>
                Browse the catalog
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" size="lg">
                Sign in
              </ButtonLink>
            </div>

            <p className="text-xs mt-6" style={{ color: "var(--foreground-muted)" }}>
              Access is granted by your CLP care team. No payment, ever.
            </p>
          </div>

          {/* A composed preview of the real interface rather than stock imagery. */}
          <div className="relative rise" style={{ animationDelay: "120ms" }}>
            <div
              className="absolute -inset-6 rounded-[2.5rem] -z-10 hidden lg:block"
              style={{ background: "linear-gradient(140deg, var(--accent-blue-light) 0%, transparent 60%)" }}
              aria-hidden="true"
            />
            <div className="card p-5 md:p-6" style={{ boxShadow: "var(--shadow-lg)" }}>
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--foreground-muted)" }}>
                  Your learning
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-1 rounded-full"
                  style={{ background: "var(--accent-indigo-light)", color: "var(--accent-indigo)" }}
                >
                  All Access
                </span>
              </div>

              {[
                { title: "Gut Health Foundations", cat: "Digestive Health", accent: "teal", pct: 72, done: 3, total: 4 },
                { title: "Sleep and Recovery Basics", cat: "Lifestyle", accent: "rose", pct: 40, done: 2, total: 5 },
              ].map((c) => (
                <div key={c.title} className="py-4" style={{ borderTop: "1px solid var(--border-light)" }}>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `var(--accent-${c.accent}-light)`, color: `var(--accent-${c.accent})` }}
                  >
                    {c.cat}
                  </span>
                  <p className="text-sm font-medium mt-2.5 mb-3" style={{ color: "var(--foreground)" }}>
                    {c.title}
                  </p>
                  <div className="flex items-center justify-between text-[11px] mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                    <span className="font-mono">{c.done} of {c.total} lessons</span>
                    <span className="font-mono" style={{ color: `var(--accent-${c.accent})` }}>{c.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-light)" }}>
                    <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: `var(--accent-${c.accent})` }} />
                  </div>
                </div>
              ))}

              <div
                className="flex items-center gap-2.5 pt-4 mt-1"
                style={{ borderTop: "1px solid var(--border-light)" }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--accent-amber-light)", color: "var(--accent-amber)" }}
                >
                  <Certificate size={16} weight="duotone" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                    Certificate issued
                  </p>
                  <p className="text-[10px] font-mono" style={{ color: "var(--foreground-muted)" }}>
                    CLP-2026-K7M2QX9P
                  </p>
                </div>
                <SealCheck size={16} weight="fill" className="ml-auto flex-shrink-0" style={{ color: "var(--success)" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works: a 2-column offset grid, not three equal cards. */}
      <section className="px-4 md:px-6 py-20" style={{ background: "var(--card-secondary)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="max-w-[46ch] mb-14">
            <h2
              className="text-2xl md:text-3xl font-semibold tracking-tight mb-3"
              style={{ color: "var(--foreground)" }}
            >
              How it works
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-secondary)" }}>
              Four steps from request to certificate. Your care team stays in the loop the whole way.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-12">
            {STEPS.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <div key={step.n} className={i % 2 === 1 ? "md:mt-10" : ""}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `var(--accent-${step.accent}-light)`, color: `var(--accent-${step.accent})` }}
                    >
                      <StepIcon size={19} weight="duotone" />
                    </div>
                    <span
                      className="font-mono text-xs font-semibold"
                      style={{ color: "var(--foreground-muted)" }}
                    >
                      {step.n}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2 tracking-tight" style={{ color: "var(--foreground)" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed max-w-[46ch]" style={{ color: "var(--foreground-secondary)" }}>
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA: left-aligned statement, action on the right. */}
      <section className="px-4 md:px-6 py-20 md:py-24">
        <div className="max-w-6xl mx-auto flex items-end justify-between gap-10 flex-wrap">
          <div className="max-w-[48ch]">
            <ChartLineUp size={26} weight="duotone" className="mb-5" style={{ color: "var(--primary)" }} />
            <h2
              className="text-2xl md:text-3xl font-semibold tracking-tight mb-3"
              style={{ color: "var(--foreground)" }}
            >
              Start with one course.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-secondary)" }}>
              Pick something from the catalog and send the request. Your care team will get you
              access, usually within a day.
            </p>
          </div>
          <ButtonLink href="/courses" size="lg" iconRight={<ArrowRight size={15} weight="bold" />}>
            View all courses
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
