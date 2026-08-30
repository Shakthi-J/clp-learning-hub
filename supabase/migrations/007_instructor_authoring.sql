-- Lets instructors author the content of courses assigned to them.
--
-- 000 granted write access on course content to admins only, so the builder
-- components (which write straight to the tables through RLS) refused every
-- instructor edit. Each policy below scopes the instructor to their own
-- courses via courses.instructor_id; admins keep the blanket access from 000.
--
-- Idempotent - safe to re-run.

-- Does the signed-in instructor own this course?
create or replace function public.owns_course(target uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  owner uuid;
begin
  select instructor_id into owner from courses where id = target;
  return owner is not null and owner = current_patient_id();
end $$;

-- Resolve the owning course for a module / lesson / quiz, so the policies below
-- can be written against the course regardless of nesting depth.
create or replace function public.course_of_module(target uuid) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare
  result uuid;
begin
  select course_id into result from modules where id = target;
  return result;
end $$;

create or replace function public.course_of_lesson(target uuid) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare
  result uuid;
begin
  select m.course_id into result
  from lessons l join modules m on m.id = l.module_id
  where l.id = target;
  return result;
end $$;

create or replace function public.course_of_quiz(target uuid) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare
  result uuid;
begin
  select coalesce(course_of_lesson(q.lesson_id), course_of_module(q.module_id))
    into result
  from quizzes q where q.id = target;
  return result;
end $$;

create or replace function public.course_of_assessment(target uuid) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare
  result uuid;
begin
  select course_of_module(a.module_id) into result from assessments a where a.id = target;
  return result;
end $$;

-- Courses: an instructor may edit their own, but not create or delete one.
-- Assignment stays an admin action, so instructors cannot grant themselves work.
drop policy if exists "instructors update own courses" on courses;
create policy "instructors update own courses" on courses
  for update using (owns_course(id)) with check (owns_course(id));

-- Modules
drop policy if exists "instructors write own modules" on modules;
create policy "instructors write own modules" on modules
  for all using (owns_course(course_id)) with check (owns_course(course_id));

-- Lessons
drop policy if exists "instructors write own lessons" on lessons;
create policy "instructors write own lessons" on lessons
  for all using (owns_course(course_of_module(module_id)))
  with check (owns_course(course_of_module(module_id)));

-- Quizzes and their questions
drop policy if exists "instructors write own quizzes" on quizzes;
create policy "instructors write own quizzes" on quizzes
  for all using (owns_course(coalesce(course_of_lesson(lesson_id), course_of_module(module_id))))
  with check (owns_course(coalesce(course_of_lesson(lesson_id), course_of_module(module_id))));

drop policy if exists "instructors write own quiz questions" on quiz_questions;
create policy "instructors write own quiz questions" on quiz_questions
  for all using (owns_course(course_of_quiz(quiz_id)))
  with check (owns_course(course_of_quiz(quiz_id)));

-- Assessments and their questions
drop policy if exists "instructors write own assessments" on assessments;
create policy "instructors write own assessments" on assessments
  for all using (owns_course(course_of_module(module_id)))
  with check (owns_course(course_of_module(module_id)));

drop policy if exists "instructors write own assessment questions" on assessment_questions;
create policy "instructors write own assessment questions" on assessment_questions
  for all using (owns_course(course_of_assessment(assessment_id)))
  with check (owns_course(course_of_assessment(assessment_id)));

-- Assignments
drop policy if exists "instructors write own assignments" on assignments;
create policy "instructors write own assignments" on assignments
  for all using (owns_course(course_of_lesson(lesson_id)))
  with check (owns_course(course_of_lesson(lesson_id)));
