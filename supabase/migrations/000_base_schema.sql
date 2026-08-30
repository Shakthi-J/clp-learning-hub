-- CLP Learning Hub - base schema.
--
-- Reconstructed from the application code, because the original schema.sql
-- referenced by SETUP.md was never committed to the repo.
-- Run this FIRST on a new Supabase project, then 001, 002, 003 in order.
-- Idempotent - safe to re-run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  email text,
  name text,
  role text not null default 'patient',
  access_type text not null default 'single_course',
  created_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'patients_role_check') then
    alter table patients add constraint patients_role_check
      check (role in ('admin', 'patient', 'instructor'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'patients_access_type_check') then
    alter table patients add constraint patients_access_type_check
      check (access_type in ('single_course', 'all_access'));
  end if;
end $$;

-- Helper functions. plpgsql (never inlined) + SECURITY DEFINER so that policies
-- on `patients` can call them without re-entering their own RLS check. A plain
-- `language sql` function here would be inlined and cause infinite recursion.
create or replace function public.current_patient_id() returns uuid
language plpgsql stable security definer set search_path = public as $$
declare
  result uuid;
begin
  select id into result from patients where auth_user_id = auth.uid() limit 1;
  return result;
end $$;

create or replace function public.current_user_role() returns text
language plpgsql stable security definer set search_path = public as $$
declare
  result text;
begin
  select role into result from patients where auth_user_id = auth.uid() limit 1;
  return result;
end $$;

create or replace function public.is_staff() returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  result text;
begin
  select role into result from patients where auth_user_id = auth.uid() limit 1;
  return coalesce(result in ('admin', 'instructor'), false);
end $$;

create or replace function public.is_admin() returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  result text;
begin
  select role into result from patients where auth_user_id = auth.uid() limit 1;
  return coalesce(result = 'admin', false);
end $$;

-- Every new auth user gets a patients row.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.patients (auth_user_id, email, name, role, access_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'patient',
    'single_course'
  )
  on conflict (auth_user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  category text,
  thumbnail_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  title text not null,
  "order" integer not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists modules_course_idx on modules (course_id, "order");

-- The FK must be named lessons_module_id_fkey: the app relies on that name in
-- its PostgREST joins (lessons!lessons_module_id_fkey).
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules (id) on delete cascade,
  title text not null,
  slug text not null,
  "order" integer not null default 1,
  youtube_video_id text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists lessons_module_idx on lessons (module_id, "order");
create unique index if not exists lessons_module_slug_key on lessons (module_id, slug);

-- ---------------------------------------------------------------------------
-- Enrollment workflow
-- ---------------------------------------------------------------------------
create table if not exists enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references patients (id) on delete set null
);
create index if not exists enrollment_requests_status_idx on enrollment_requests (status, requested_at desc);
create index if not exists enrollment_requests_patient_idx on enrollment_requests (patient_id);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'completed')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists enrollments_patient_idx on enrollments (patient_id, status);
create index if not exists enrollments_course_idx on enrollments (course_id, status);

-- onConflict "enrollment_id,lesson_id" in the progress API needs this index.
create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments (id) on delete cascade,
  lesson_id uuid not null references lessons (id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz
);
create unique index if not exists lesson_progress_enrollment_lesson_key
  on lesson_progress (enrollment_id, lesson_id);

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments (id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Quizzes (lesson level) and assessments (module level)
-- ---------------------------------------------------------------------------
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons (id) on delete cascade,
  module_id uuid references modules (id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);
create index if not exists quizzes_lesson_idx on quizzes (lesson_id);
create index if not exists quizzes_module_idx on quizzes (module_id);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes (id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null
);
create index if not exists quiz_questions_quiz_idx on quiz_questions (quiz_id);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes (id) on delete cascade,
  patient_id uuid not null references patients (id) on delete cascade,
  score integer not null default 0,
  answers jsonb,
  attempted_at timestamptz not null default now()
);
create index if not exists quiz_attempts_patient_idx on quiz_attempts (patient_id, quiz_id);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules (id) on delete cascade,
  title text not null,
  instructions text,
  pass_threshold integer not null default 70,
  created_at timestamptz not null default now()
);
create index if not exists assessments_module_idx on assessments (module_id);

create table if not exists assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments (id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  "order" integer not null default 1
);
create index if not exists assessment_questions_assessment_idx
  on assessment_questions (assessment_id, "order");

create table if not exists assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments (id) on delete cascade,
  patient_id uuid not null references patients (id) on delete cascade,
  enrollment_id uuid references enrollments (id) on delete cascade,
  score integer not null default 0,
  passed boolean not null default false,
  answers jsonb,
  attempted_at timestamptz not null default now()
);
create index if not exists assessment_attempts_patient_idx
  on assessment_attempts (patient_id, assessment_id);

-- ---------------------------------------------------------------------------
-- Assignments
-- ---------------------------------------------------------------------------
create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons (id) on delete cascade,
  title text not null,
  prompt text,
  created_at timestamptz not null default now()
);
create index if not exists assignments_lesson_idx on assignments (lesson_id);

-- The FK must be named assignment_submissions_patient_id_fkey: the admin and
-- instructor grading queries join through that name.
create table if not exists assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments (id) on delete cascade,
  patient_id uuid not null references patients (id) on delete cascade,
  enrollment_id uuid references enrollments (id) on delete cascade,
  response text,
  status text not null default 'submitted'
    check (status in ('submitted', 'approved', 'needs_revision')),
  feedback text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references patients (id) on delete set null
);
create unique index if not exists assignment_submissions_patient_assignment_key
  on assignment_submissions (patient_id, assignment_id);
create index if not exists assignment_submissions_status_idx
  on assignment_submissions (status, submitted_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table patients               enable row level security;
alter table courses                enable row level security;
alter table modules                enable row level security;
alter table lessons                enable row level security;
alter table enrollment_requests    enable row level security;
alter table enrollments            enable row level security;
alter table lesson_progress        enable row level security;
alter table certificates           enable row level security;
alter table quizzes                enable row level security;
alter table quiz_questions         enable row level security;
alter table quiz_attempts          enable row level security;
alter table assessments            enable row level security;
alter table assessment_questions   enable row level security;
alter table assessment_attempts    enable row level security;
alter table assignments            enable row level security;
alter table assignment_submissions enable row level security;

-- patients ------------------------------------------------------------------
drop policy if exists "read own patient row" on patients;
create policy "read own patient row" on patients
  for select using (auth_user_id = auth.uid() or is_staff());

drop policy if exists "update own patient row" on patients;
create policy "update own patient row" on patients
  for update using (auth_user_id = auth.uid() or is_admin())
  with check (auth_user_id = auth.uid() or is_admin());

-- courses -------------------------------------------------------------------
drop policy if exists "read published courses" on courses;
create policy "read published courses" on courses
  for select using (published or is_staff());

drop policy if exists "admins write courses" on courses;
create policy "admins write courses" on courses
  for all using (is_admin()) with check (is_admin());

-- modules / lessons ---------------------------------------------------------
drop policy if exists "read modules of visible courses" on modules;
create policy "read modules of visible courses" on modules
  for select using (
    is_staff() or exists (
      select 1 from courses c
      where c.id = modules.course_id
        and (c.published or exists (
          select 1 from enrollments e
          where e.course_id = c.id and e.patient_id = current_patient_id()
        ))
    )
  );

drop policy if exists "admins write modules" on modules;
create policy "admins write modules" on modules
  for all using (is_admin()) with check (is_admin());

drop policy if exists "read lessons of visible courses" on lessons;
create policy "read lessons of visible courses" on lessons
  for select using (
    is_staff() or exists (
      select 1 from modules m
      join courses c on c.id = m.course_id
      where m.id = lessons.module_id
        and (c.published or exists (
          select 1 from enrollments e
          where e.course_id = c.id and e.patient_id = current_patient_id()
        ))
    )
  );

drop policy if exists "admins write lessons" on lessons;
create policy "admins write lessons" on lessons
  for all using (is_admin()) with check (is_admin());

-- enrollment workflow -------------------------------------------------------
drop policy if exists "read own requests" on enrollment_requests;
create policy "read own requests" on enrollment_requests
  for select using (patient_id = current_patient_id() or is_staff());

drop policy if exists "create own requests" on enrollment_requests;
create policy "create own requests" on enrollment_requests
  for insert with check (patient_id = current_patient_id());

drop policy if exists "admins review requests" on enrollment_requests;
create policy "admins review requests" on enrollment_requests
  for update using (is_admin()) with check (is_admin());

drop policy if exists "read own enrollments" on enrollments;
create policy "read own enrollments" on enrollments
  for select using (patient_id = current_patient_id() or is_staff());

drop policy if exists "admins create enrollments" on enrollments;
create policy "admins create enrollments" on enrollments
  for insert with check (is_admin());

-- Learners complete their own enrollment; admins may correct any.
drop policy if exists "update own enrollment" on enrollments;
create policy "update own enrollment" on enrollments
  for update using (patient_id = current_patient_id() or is_admin())
  with check (patient_id = current_patient_id() or is_admin());

drop policy if exists "own lesson progress" on lesson_progress;
create policy "own lesson progress" on lesson_progress
  for all using (
    exists (
      select 1 from enrollments e
      where e.id = lesson_progress.enrollment_id
        and (e.patient_id = current_patient_id() or is_staff())
    )
  ) with check (
    exists (
      select 1 from enrollments e
      where e.id = lesson_progress.enrollment_id
        and e.patient_id = current_patient_id()
    )
  );

-- certificates: the patient read policy is added in 001; issuing uses the
-- service role, which bypasses RLS.
drop policy if exists "staff read certificates" on certificates;
create policy "staff read certificates" on certificates
  for select using (is_staff());

-- quizzes and assessments ---------------------------------------------------
drop policy if exists "read quizzes when entitled" on quizzes;
create policy "read quizzes when entitled" on quizzes
  for select using (is_staff() or current_patient_id() is not null);

drop policy if exists "admins write quizzes" on quizzes;
create policy "admins write quizzes" on quizzes
  for all using (is_admin()) with check (is_admin());

drop policy if exists "read quiz questions when entitled" on quiz_questions;
create policy "read quiz questions when entitled" on quiz_questions
  for select using (is_staff() or current_patient_id() is not null);

drop policy if exists "admins write quiz questions" on quiz_questions;
create policy "admins write quiz questions" on quiz_questions
  for all using (is_admin()) with check (is_admin());

drop policy if exists "own quiz attempts" on quiz_attempts;
create policy "own quiz attempts" on quiz_attempts
  for all using (patient_id = current_patient_id() or is_staff())
  with check (patient_id = current_patient_id());

drop policy if exists "read assessments when entitled" on assessments;
create policy "read assessments when entitled" on assessments
  for select using (is_staff() or current_patient_id() is not null);

drop policy if exists "admins write assessments" on assessments;
create policy "admins write assessments" on assessments
  for all using (is_admin()) with check (is_admin());

drop policy if exists "read assessment questions when entitled" on assessment_questions;
create policy "read assessment questions when entitled" on assessment_questions
  for select using (is_staff() or current_patient_id() is not null);

drop policy if exists "admins write assessment questions" on assessment_questions;
create policy "admins write assessment questions" on assessment_questions
  for all using (is_admin()) with check (is_admin());

drop policy if exists "own assessment attempts" on assessment_attempts;
create policy "own assessment attempts" on assessment_attempts
  for all using (patient_id = current_patient_id() or is_staff())
  with check (patient_id = current_patient_id());

-- assignments ---------------------------------------------------------------
drop policy if exists "read assignments when entitled" on assignments;
create policy "read assignments when entitled" on assignments
  for select using (is_staff() or current_patient_id() is not null);

drop policy if exists "admins write assignments" on assignments;
create policy "admins write assignments" on assignments
  for all using (is_admin()) with check (is_admin());

drop policy if exists "read own submissions" on assignment_submissions;
create policy "read own submissions" on assignment_submissions
  for select using (patient_id = current_patient_id() or is_staff());

drop policy if exists "write own submissions" on assignment_submissions;
create policy "write own submissions" on assignment_submissions
  for insert with check (patient_id = current_patient_id());

drop policy if exists "update submissions" on assignment_submissions;
create policy "update submissions" on assignment_submissions
  for update using (patient_id = current_patient_id() or is_staff())
  with check (patient_id = current_patient_id() or is_staff());
