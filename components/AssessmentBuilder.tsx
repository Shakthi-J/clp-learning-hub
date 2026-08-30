"use client";
import { useState, useEffect } from "react";
import { Target } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

interface AssessmentBuilderProps {
  moduleId: string;
  moduleTitle: string;
}

export default function AssessmentBuilder({ moduleId, moduleTitle }: AssessmentBuilderProps) {
  const supabase = createClient();
  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [passThreshold, setPassThreshold] = useState(70);
  const [creating, setCreating] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newOpts, setNewOpts] = useState(["", "", "", ""]);
  const [newCorrect, setNewCorrect] = useState("");
  const [addingQ, setAddingQ] = useState(false);

  useEffect(() => { fetchAssessment(); }, [moduleId]);

  const fetchAssessment = async () => {
    setLoading(true);
    const { data } = await supabase.from("assessments")
      .select("id, title, instructions, pass_threshold, assessment_questions(id, question, options, correct_answer, order)")
      .eq("module_id", moduleId).maybeSingle();
    if (data) {
      setAssessment(data);
      setQuestions(data.assessment_questions || []);
      setTitle(data.title);
      setInstructions(data.instructions || "");
      setPassThreshold(data.pass_threshold);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    const { data } = await supabase.from("assessments").insert({
      module_id: moduleId, title, instructions, pass_threshold: passThreshold,
    }).select("id, title, instructions, pass_threshold").single();
    setAssessment(data);
    setCreating(false);
  };

  const handleAddQuestion = async () => {
    if (!newQ.trim() || newOpts.some(o => !o.trim()) || !newCorrect) return;
    setAddingQ(true);
    const { data } = await supabase.from("assessment_questions").insert({
      assessment_id: assessment.id,
      question: newQ.trim(),
      options: newOpts.map(o => o.trim()),
      correct_answer: newCorrect,
      order: questions.length + 1,
    }).select("id, question, options, correct_answer, order").single();
    setQuestions([...questions, data]);
    setNewQ(""); setNewOpts(["", "", "", ""]); setNewCorrect(""); setShowQuestionForm(false);
    setAddingQ(false);
  };

  const handleDeleteQuestion = async (qid: string) => {
    if (!confirm("Delete this question?")) return;
    await supabase.from("assessment_questions").delete().eq("id", qid);
    setQuestions(questions.filter(q => q.id !== qid));
  };

  if (loading) return <div className="text-xs mt-4" style={{ color: "var(--foreground-muted)" }}>Loading...</div>;

  return (
    <div className="card p-5 mt-4" style={{ border: "1px solid var(--secondary)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Target size={16} weight="duotone" />
        <h4 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Module Quiz</h4>
        {assessment && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
            Pass {assessment.pass_threshold}% · {questions.length} question{questions.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {!assessment ? (
        <div>
          <p className="text-xs mb-3" style={{ color: "var(--foreground-muted)" }}>
            Create a module quiz with a pass mark. Patients must pass to complete this module.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder={`${moduleTitle} Quiz`}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>Instructions (optional)</label>
              <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2}
                placeholder="Instructions for the patient..."
                className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>Pass Threshold (%)</label>
              <input type="number" value={passThreshold} onChange={e => setPassThreshold(Number(e.target.value))}
                min={1} max={100}
                className="w-24 px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
            </div>
            <button onClick={handleCreate} disabled={creating || !title}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold primary-gradient disabled:opacity-60">
              {creating ? "Creating..." : "Create Module Quiz"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl p-3 mb-2 flex items-start justify-between gap-2"
              style={{ background: "var(--card-secondary)", border: "1px solid var(--border)" }}>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{i + 1}. {q.question}</p>
                <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                  Correct: <strong>{q.correct_answer}</strong>
                </p>
              </div>
              <button onClick={() => handleDeleteQuestion(q.id)} className="text-xs flex-shrink-0" style={{ color: "var(--danger)" }}>Delete</button>
            </div>
          ))}

          <button onClick={() => setShowQuestionForm(!showQuestionForm)} className="text-xs font-semibold mt-2"
            style={{ color: "var(--primary)" }}>
            {showQuestionForm ? "Cancel" : "+ Add Question"}
          </button>

          {showQuestionForm && (
            <div className="rounded-xl p-4 mt-3" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>Question</label>
                <input type="text" value={newQ} onChange={e => setNewQ(e.target.value)}
                  placeholder="Enter your question"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }} />
              </div>
              <div className="mb-3 space-y-2">
                {newOpts.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="qcorrect" value={opt}
                      checked={newCorrect === opt && !!opt}
                      onChange={() => opt && setNewCorrect(opt)} />
                    <input type="text" value={opt} onChange={e => {
                      const u = [...newOpts]; u[i] = e.target.value; setNewOpts(u);
                      if (newCorrect === opt) setNewCorrect(e.target.value);
                    }}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-1.5 rounded-lg border text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }} />
                  </div>
                ))}
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                  Select the radio button next to the correct answer
                </p>
              </div>
              <button onClick={handleAddQuestion}
                disabled={addingQ || !newQ || newOpts.some(o => !o) || !newCorrect}
                className="px-4 py-2 rounded-lg text-white text-xs font-semibold primary-gradient disabled:opacity-60">
                {addingQ ? "Adding..." : "Add Question"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}