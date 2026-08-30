"use client";
import { useState } from "react";
import { Notebook, Check, X, Circle } from "@phosphor-icons/react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
}

interface QuizBlockProps {
  quizId: string;
  title: string;
  questions: Question[];
  patientId: string;
}

export default function QuizBlock({ quizId, title, questions, patientId }: QuizBlockProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) return;
    setLoading(true);
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, answers }),
    });
    const data = await res.json();
    setScore(data.score);
    setSubmitted(true);
    setLoading(false);
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  return (
    <div className="card p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Notebook size={18} weight="duotone" />
        <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>{title}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {submitted ? (
        <div>
          <div className="rounded-xl p-4 mb-4 text-center" style={{ background: pct >= 70 ? "var(--success-light)" : "var(--danger-light)" }}>
            <p className="text-2xl font-bold mb-1" style={{ color: pct >= 70 ? "var(--primary)" : "var(--danger)" }}>{pct}%</p>
            <p className="text-sm font-semibold" style={{ color: pct >= 70 ? "var(--primary)" : "var(--danger)" }}>
              {score} of {questions.length} correct — {pct >= 70 ? "Great job!" : "Keep practicing!"}
            </p>
          </div>
          {questions.map((q) => (
            <div key={q.id} className="mb-4">
              <p className="text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>{q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt) => {
                  const isCorrect = opt === q.correct_answer;
                  const isSelected = answers[q.id] === opt;
                  return (
                    <div key={opt} className="px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                      style={{
                        background: isCorrect ? "var(--success-light)" : isSelected && !isCorrect ? "var(--danger-light)" : "var(--card-secondary)",
                        color: isCorrect ? "var(--primary)" : isSelected && !isCorrect ? "var(--danger)" : "var(--foreground-secondary)",
                        border: `1px solid ${isCorrect ? "var(--secondary)" : isSelected && !isCorrect ? "var(--danger-light)" : "var(--border)"}`,
                      }}>
                      <span className="inline-flex items-center gap-2">{isCorrect ? <Check size={14} weight="bold" className="flex-shrink-0" /> : isSelected && !isCorrect ? <X size={14} weight="bold" className="flex-shrink-0" /> : <Circle size={14} className="flex-shrink-0" />}{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <button onClick={handleRetake} className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
            Retake Quiz
          </button>
        </div>
      ) : (
        <div>
          {questions.map((q, qi) => (
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
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold primary-gradient disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Submitting..." : "Submit Quiz"}
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
