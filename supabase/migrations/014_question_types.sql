-- Lets a question be something other than "pick one of four".
--
-- Both question tables previously assumed a single correct option, with
-- correct_answer holding that option's text. That still holds for
-- multiple_choice. The new types reuse the same column:
--
--   multiple_choice  correct_answer is the correct option's text
--   checkboxes       correct_answer is a JSON array of the correct options
--   short_answer     correct_answer is the expected text, compared
--                    case-insensitively and trimmed; options stays empty
--
-- Existing rows become multiple_choice, which is what they already were.
--
-- Idempotent - safe to re-run.

alter table quiz_questions
  add column if not exists question_type text not null default 'multiple_choice';

alter table assessment_questions
  add column if not exists question_type text not null default 'multiple_choice';

-- Dropped and recreated so re-running does not fail on an existing constraint.
alter table quiz_questions drop constraint if exists quiz_questions_type_check;
alter table quiz_questions add constraint quiz_questions_type_check
  check (question_type in ('multiple_choice', 'checkboxes', 'short_answer'));

alter table assessment_questions drop constraint if exists assessment_questions_type_check;
alter table assessment_questions add constraint assessment_questions_type_check
  check (question_type in ('multiple_choice', 'checkboxes', 'short_answer'));
