"use client";
import { useState, useEffect } from "react";
import { Notebook } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id?: string;
  question: string;
  options: string[];
  correct_answer: string;
}

interface QuizBuilderProps {
  lessonId?: string;
  moduleId?: string;
  label: string;
}

export default function QuizBuilder({ lessonId, moduleId, label }: QuizBuilderProps) {
  const supabase = createClient();
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New question form
  const [newQ, setNewQ] = useState("");
  const [newOpts, setNewOpts] = useState(["", "", "", ""]);
  const [newCorrect, setNewCorrect] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchQuiz(); }, []);

  const fetchQuiz = async () => {
    setLoading(true);
    let query = supabase.from("quizzes").select("id, title, quiz_questions(id, question, options, correct_answer)");
    if (lessonId) query = query.eq("lesson_id", lessonId);
    if (moduleId) query = query.eq("module_id", moduleId);
    const { data } = await query.maybeSingle();
    if (data) {
      setQuizId(data.id);
      setQuestions((data.quiz_questions as Question[]) || []);
    }
    setLoading(false);
  };

  const ensureQuiz = async () => {
    if (quizId) return quizId;
    const { data } = await supabase.from("quizzes").insert({
      title: `${label} Quiz`,
      lesson_id: lessonId || null,
      module_id: moduleId || null,
    }).select("id").single();
    setQuizId(data!.id);
    return data!.id;
  };

  const handleAddQuestion = async () => {
    if (!newQ.trim() || newOpts.some(o => !o.trim()) || !newCorrect) return;
    setAdding(true);
    const qid = await ensureQuiz();
    const { data } = await supabase.from("quiz_questions").insert({
      quiz_id: qid,
      question: newQ.trim(),
      options: newOpts.map(o => o.trim()),
      correct_answer: newCorrect,
    }).select("id, question, options, correct_answer").single();
    setQuestions([...questions, data as Question]);
    setNewQ(""); setNewOpts(["", "", "", ""]); setNewCorrect(""); setShowForm(false);
    setAdding(false);
  };

  const handleDeleteQuestion = async (qid: string) => {
    if (!confirm("Delete this question?")) return;
    await supabase.from("quiz_questions").delete().eq("id", qid);
    setQuestions(questions.filter(q => q.id !== qid));
  };

  if (loading) return <div className="text-xs" style={{ color: "var(--foreground-muted)" }}>Loading quiz...</div>;

  return (
    <div className="card p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Notebook size={16} weight="duotone" />
          <h4 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{label} Quiz</h4>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            {questions.length} question{questions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
          {showForm ? "Cancel" : "+ Add Question"}
        </button>
      </div>

      {/* Existing questions */}
      {questions.length > 0 && (
        <div className="space-y-2 mb-4">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl p-3 flex items-start justify-between gap-2"
              style={{ background: "var(--card-secondary)", border: "1px solid var(--border)" }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{i + 1}. {q.question}</p>
                <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                  Options: {(q.options as string[]).join(", ")} · Correct: <strong>{q.correct_answer}</strong>
                </p>
              </div>
              <button onClick={() => handleDeleteQuestion(q.id!)} className="text-xs flex-shrink-0" style={{ color: "var(--danger)" }}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {/* Add question form */}
      {showForm && (
        <div className="rounded-xl p-4" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>Question</label>
            <input type="text" value={newQ} onChange={e => setNewQ(e.target.value)}
              placeholder="Enter your question"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }} />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>Options (4)</label>
            <div className="space-y-2">
              {newOpts.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="radio" name="correct" value={opt} checked={newCorrect === opt && !!opt}
                    onChange={() => opt && setNewCorrect(opt)} />
                  <input type="text" value={opt} onChange={e => {
                    const updated = [...newOpts]; updated[i] = e.target.value;
                    setNewOpts(updated);
                    if (newCorrect === opt) setNewCorrect(e.target.value);
                  }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 px-3 py-1.5 rounded-lg border text-sm"
                    style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }} />
                </div>
              ))}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>Select the radio button next to the correct answer</p>
          </div>
          <button onClick={handleAddQuestion} disabled={adding || !newQ || newOpts.some(o => !o) || !newCorrect}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold primary-gradient disabled:opacity-60">
            {adding ? "Adding..." : "Add Question"}
          </button>
        </div>
      )}

      {questions.length === 0 && !showForm && (
        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>No questions yet. Click + Add Question to create the first one.</p>
      )}
    </div>
  );
}
