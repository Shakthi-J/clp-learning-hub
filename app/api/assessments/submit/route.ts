import { createClient } from "@/lib/supabase/server";
import { isCorrect, type QuestionType } from "@/lib/questionTypes";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { assessmentId, enrollmentId, answers } = await request.json();

  const { data: patient } = await supabase.from("patients").select("id").eq("auth_user_id", user.id).single();

  const { data: assessment } = await supabase.from("assessments")
    .select("pass_threshold").eq("id", assessmentId).single();

  const { data: questions } = await supabase.from("assessment_questions")
    .select("id, question_type, correct_answer").eq("assessment_id", assessmentId);

  if (!questions || !assessment) return NextResponse.json({ message: "Assessment not found" }, { status: 404 });

  // Scored server-side with the same rules the learner's browser used.
  const score = questions.reduce((acc, q) => {
    const type = (q.question_type ?? "multiple_choice") as QuestionType;
    return isCorrect(type, q.correct_answer, answers?.[q.id]) ? acc + 1 : acc;
  }, 0);
  const pct = Math.round((score / questions.length) * 100);
  const passed = pct >= assessment.pass_threshold;

  await supabase.from("assessment_attempts").insert({
    patient_id: patient?.id,
    assessment_id: assessmentId,
    enrollment_id: enrollmentId,
    score,
    passed,
    answers,
  });

  return NextResponse.json({ score, total: questions.length, pct, passed });
}
