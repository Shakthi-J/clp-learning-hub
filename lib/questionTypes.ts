/**
 * Question types shared by quizzes and module assessments.
 *
 * Grading lives here rather than in the API route so the learner-facing
 * component and the server score an answer exactly the same way.
 */

export type QuestionType = "multiple_choice" | "checkboxes" | "short_answer";

export const QUESTION_TYPES: { value: QuestionType; label: string; hint: string }[] = [
  {
    value: "multiple_choice",
    label: "Multiple choice",
    hint: "One correct option.",
  },
  {
    value: "checkboxes",
    label: "Checkboxes",
    hint: "Several correct options. All of them must be picked, and none of the wrong ones.",
  },
  {
    value: "short_answer",
    label: "Short answer",
    hint: "Typed answer, matched ignoring case and surrounding spaces.",
  },
];

/** How a checkboxes answer set is stored in a single text column. */
export function encodeChoices(choices: string[]): string {
  return JSON.stringify([...choices].sort());
}

export function decodeChoices(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    // Written before this column held JSON, or hand-edited.
    return value ? [value] : [];
  }
}

const normalise = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * True when the learner's answer earns the mark.
 *
 * `given` is a string for multiple_choice and short_answer, and an array of
 * the selected options for checkboxes.
 */
export function isCorrect(
  type: QuestionType,
  correctAnswer: string,
  given: unknown
): boolean {
  if (type === "checkboxes") {
    const expected = decodeChoices(correctAnswer);
    const actual = Array.isArray(given) ? given.map(String) : [];
    if (expected.length !== actual.length) return false;
    const a = [...expected].sort();
    const b = [...actual].sort();
    return a.every((value, i) => value === b[i]);
  }

  if (type === "short_answer") {
    return typeof given === "string" && normalise(given) === normalise(correctAnswer);
  }

  return given === correctAnswer;
}

/** Has the learner supplied anything for this question? */
export function isAnswered(type: QuestionType, given: unknown): boolean {
  if (type === "checkboxes") return Array.isArray(given) && given.length > 0;
  return typeof given === "string" && given.trim().length > 0;
}
