"use client";
import { useRouter } from "next/navigation";
import QuizBlock from "@/components/QuizBlock";
import AssessmentBlock from "@/components/AssessmentBlock";

interface Props {
  type: "quiz" | "assessment";
  // quiz props
  quizId?: string;
  quizTitle?: string;
  // assessment props
  assessmentId?: string;
  assessmentTitle?: string;
  instructions?: string | null;
  passThreshold?: number;
  enrollmentId?: string;
  lastAttempt?: { score: number; passed: boolean; attempted_at: string } | null;
  // shared
  questions: any[];
  patientId?: string;
}

export default function ModuleAssessmentWrapper(props: Props) {
  const router = useRouter();

  if (props.type === "quiz") {
    return (
      <QuizBlock
        quizId={props.quizId!}
        title={props.quizTitle!}
        questions={props.questions}
        patientId={props.patientId!}
      />
    );
  }

  return (
    <AssessmentBlock
      assessmentId={props.assessmentId!}
      enrollmentId={props.enrollmentId!}
      title={props.assessmentTitle!}
      instructions={props.instructions || null}
      passThreshold={props.passThreshold || 70}
      questions={props.questions}
      lastAttempt={props.lastAttempt || null}
      onPassed={() => router.refresh()}
    />
  );
}
