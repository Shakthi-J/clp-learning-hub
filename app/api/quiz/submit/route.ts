import { createClient } from "@/lib/supabase/server";
import { isCorrect, type QuestionType } from "@/lib/questionTypes";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { quizId, answers } = await request.json();

  const { data: patient } = await supabase
    .from("patients").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (!patient) return NextResponse.json({ message: "No profile" }, { status: 403 });

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, question_type, correct_answer")
    .eq("quiz_id", quizId);

  if (!questions) return NextResponse.json({ message: "Quiz not found" }, { status: 404 });

  // Scored server-side with the same rules the learner's browser used, so a
  // tampered request cannot award itself a mark.
  const score = questions.reduce((acc, q) => {
    const type = (q.question_type ?? "multiple_choice") as QuestionType;
    return isCorrect(type, q.correct_answer, answers?.[q.id]) ? acc + 1 : acc;
  }, 0);

  await supabase
    .from("quiz_attempts")
    .insert({ patient_id: patient.id, quiz_id: quizId, score, answers });

  return NextResponse.json({ score, total: questions.length });
}
