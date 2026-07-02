export const metadata = { title: "About" };
export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--foreground)" }}>About CLP Learning Hub</h1>
      <p className="text-lg" style={{ color: "var(--foreground-secondary)" }}>
        CLP Learning Hub is the patient education platform of Clinic Living Plus, a longevity and disease-reversal clinic based in Bangalore. Our courses are designed and recorded by our clinical team to help patients understand their health journeys.
      </p>
    </div>
  );
}
