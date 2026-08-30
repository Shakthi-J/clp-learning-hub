"use client";
import { useState } from "react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  order: number;
}

interface AssessmentBlockProps {
  assessmentId: string;
  enrollmentId: string;
  title: string;
  instructions: string | null;
  passThreshold: number;
  questions: Question[];
  lastAttempt: { score: number; passed: boolean; attempted_at: string } | null;
  onPassed: () => void;
}

export default function AssessmentBlock({
  assessmentId, enrollmentId, title, instructions, passThreshold,
  questions, lastAttempt, onPassed,
}: AssessmentBlockProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; pct: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [taking, setTaking] = useState(!lastAttempt);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) return;
    setLoading(true);
    const res = await fetch("/api/assessments/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId, enrollmentId, answers }),
    });
    const data = await res.json();
    setResult(data);
    setTaking(false);
    setLoading(false);
    if (data.passed) onPassed();
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
    setTaking(true);
  };

  const displayResult = result || (lastAttempt ? {
    score: lastAttempt.score,
    passed: lastAttempt.passed,
    pct: Math.round((lastAttempt.score / questions.length) * 100),
  } : null);

  return (
    <div className="card p-6 mt-6" style={{ border: "2px solid var(--secondary)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🎯</span>
        <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>{title}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full ml-auto font-semibold"
          style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
          Assessment · Pass {passThreshold}%
        </span>
      </div>

      {instructions && (
        <p className="text-sm mb-4" style={{ color: "var(--foreground-secondary)" }}>{instructions}</p>
      )}

      {!taking && displayResult && (
        <div>
          <div className="rounded-xl p-5 mb-5 text-center"
            style={{ background: displayResult.passed ? "var(--success-light)" : "var(--danger-light)" }}>
            <p className="text-3xl font-bold mb-1" style={{ color: displayResult.passed ? "var(--primary)" : "var(--danger)" }}>
              {displayResult.pct}%
            </p>
            <p className="font-semibold mb-1" style={{ color: displayResult.passed ? "var(--primary)" : "var(--danger)" }}>
              {displayResult.passed ? "Passed! Well done." : `Not passed yet. You need ${passThreshold}% to pass.`}
            </p>
            <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>
              {displayResult.score} of {questions.length} correct
            </p>
          </div>

          {!displayResult.passed && (
            <div className="text-center">
              <p className="text-sm mb-3" style={{ color: "var(--foreground-secondary)" }}>
                You can retake this assessment as many times as needed.
              </p>
              <button onClick={handleRetake}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient">
                Retake Assessment
              </button>
            </div>
          )}

          {displayResult.passed && (
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                ✓ Module unlocked — you can continue to the next module
              </p>
            </div>
          )}
        </div>
      )}

      {taking && (
        <div>
          {questions.sort((a, b) => a.order - b.order).map((q, qi) => (
            <div key={q.id} className="mb-5">
              <p className="text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <button key={opt} onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                    style={{
                      background: answers[q.id] === opt ? "var(--primary-light)" : "var(--card-secondary)",
                      color: answers[q.id] === opt ? "var(--primary)" : "var(--foreground-secondary)",
                      border: `1px solid ${answers[q.id] === opt ? "var(--secondary)" : "var(--border)"}`,
                    }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button onClick={handleSubmit}
            disabled={loading || Object.keys(answers).length < questions.length}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Submitting..." : "Submit Assessment"}
          </button>
          {Object.keys(answers).length < questions.length && (
            <p className="text-xs mt-2" style={{ color: "var(--foreground-muted)" }}>
              Answer all {questions.length} questions to submit
            </p>
          )}
        </div>
      )}
    </div>
  );
}
