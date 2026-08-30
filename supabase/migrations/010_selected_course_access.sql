-- A third access tier: staff choose exactly which courses a learner gets.
--
-- single_course lets the learner pick any one course at a time; all_access lets
-- them take everything. Neither lets the clinic say "this person does these two
-- courses", which is what a care plan usually looks like.
--
-- Idempotent - safe to re-run.

-- 1. Allow the new tier.
do $$ begin
  if exists (select 1 from pg_constraint where conname = 'patients_access_type_check') then
    alter table patients drop constraint patients_access_type_check;
  end if;
  alter table patients add constraint patients_access_type_check
    check (access_type in ('single_course', 'all_access', 'selected_courses'));
end $$;

-- 2. Which courses a learner has been given, and by whom.
create table if not exists patient_course_access (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  granted_by uuid references patients (id) on delete set null,
  granted_at timestamptz not null default now()
);

create unique index if not exists patient_course_access_unique
  on patient_course_access (patient_id, course_id);
create index if not exists patient_course_access_patient_idx
  on patient_course_access (patient_id);
create index if not exists patient_course_access_course_idx
  on patient_course_access (course_id);

alter table patient_course_access enable row level security;

-- Learners see what they have been given; staff see everything.
drop policy if exists "read course access" on patient_course_access;
create policy "read course access" on patient_course_access
  for select using (
    patient_id = current_patient_id() or is_staff()
  );

-- Admins assign any course.
drop policy if exists "admins assign courses" on patient_course_access;
create policy "admins assign courses" on patient_course_access
  for all using (is_admin()) with check (is_admin());

-- Instructors assign only their own courses, so one instructor cannot put a
-- learner into a colleague's course.
drop policy if exists "instructors assign own courses" on patient_course_access;
create policy "instructors assign own courses" on patient_course_access
  for all using (owns_course(course_id)) with check (owns_course(course_id));
