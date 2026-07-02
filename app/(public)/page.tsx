import Link from "next/link";
export default function HomePage() {
  return (
    <div>
      <section className="clinical-gradient py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            Clinic Living Plus - Patient Education
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: "var(--foreground)" }}>
            Your Health Education, <span style={{ color: "var(--primary)" }}>Guided by Experts</span>
          </h1>
          <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: "var(--foreground-secondary)" }}>
            Evidence-based health education curated by the CLP clinical team. Learn at your own pace, track your progress, and earn certificates.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/courses" className="px-6 py-3 rounded-xl text-white font-semibold text-sm primary-gradient">Browse Courses</Link>
            <Link href="/login" className="px-6 py-3 rounded-xl text-sm font-semibold border" style={{ color: "var(--foreground)", borderColor: "var(--border)", background: "var(--card)" }}>Sign In</Link>
          </div>
        </div>
      </section>
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12" style={{ color: "var(--foreground)" }}>Everything you need to learn and grow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🎓", title: "Expert-Led Courses", desc: "Every course is designed and recorded by CLP's clinical team." },
              { icon: "📈", title: "Track Your Progress", desc: "Pick up where you left off. Progress is saved automatically." },
              { icon: "🏆", title: "Earn Certificates", desc: "Complete a course and receive a downloadable certificate." },
            ].map((f) => (
              <div key={f.title} className="card p-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4" style={{ background: "var(--primary-light)" }}>{f.icon}</div>
                <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>{f.title}</h3>
                <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 px-6 mx-6 mb-20 rounded-2xl text-center" style={{ background: "var(--card-secondary)" }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--foreground)" }}>Ready to start learning?</h2>
        <p className="text-sm mb-8" style={{ color: "var(--foreground-secondary)" }}>Browse the course catalog and request enrollment. Your CLP care team will get you access within 24 hours.</p>
        <Link href="/courses" className="inline-block px-6 py-3 rounded-xl text-white font-semibold text-sm primary-gradient">View All Courses</Link>
      </section>
    </div>
  );
}
