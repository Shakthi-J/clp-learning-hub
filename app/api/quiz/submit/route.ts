import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { quizId, answers } = await request.json();
  const { data: patient } = await supabase.from("patients").select("id").eq("auth_user_id", user.id).single();
  const { data: questions } = await supabase.from("quiz_questions").select("id, correct_answer").eq("quiz_id", quizId);
  if (!questions) return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
  const score = questions.reduce((acc, q) => answers[q.id] === q.correct_answer ? acc + 1 : acc, 0);
  await supabase.from("quiz_attempts").insert({ patient_id: patient?.id, quiz_id: quizId, score, answers });
  return NextResponse.json({ score, total: questions.length });
}
