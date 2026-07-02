-- ============================================================
-- CLP Learning Hub — Full Database Schema
-- Paste this entire file into Supabase SQL Editor and Run
-- ============================================================

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users on delete cascade,
  name text,
  email text,
  access_type text check (access_type in ('single_course','all_access')) default 'single_course',
  role text check (role in ('admin','patient')) default 'patient',
  created_at timestamptz default now()
);
alter table patients enable row level security;
create policy "Patients read own" on patients for select using (auth.uid() = auth_user_id);
create policy "Admins read all patients" on patients for select using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));
create policy "Admins update patients" on patients for update using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  thumbnail_url text,
  category text,
  published boolean default false,
  created_at timestamptz default now()
);
alter table courses enable row level security;
create policy "Anyone views published" on courses for select using (published = true);
create policy "Admins view all courses" on courses for select using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));
create policy "Admins manage courses" on courses for all using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));

create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses on delete cascade,
  title text not null,
  "order" int not null default 0
);
alter table modules enable row level security;
create policy "Anyone views modules of published" on modules for select using (exists (select 1 from courses c where c.id = course_id and c.published = true));
create policy "Admins manage modules" on modules for all using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules on delete cascade,
  title text not null,
  slug text not null,
  "order" int not null default 0,
  youtube_video_id text,
  notes text
);
alter table lessons enable row level security;
create policy "Enrolled patients view lessons" on lessons for select using (
  exists (select 1 from enrollments e join modules m on m.id = module_id
    where e.patient_id = (select id from patients where auth_user_id = auth.uid())
    and e.course_id = m.course_id and e.status = 'active')
);
create policy "Admins manage lessons" on lessons for all using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));

create table if not exists enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients on delete cascade,
  course_id uuid references courses on delete cascade,
  status text check (status in ('requested','approved','rejected')) default 'requested',
  requested_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references patients
);
alter table enrollment_requests enable row level security;
create policy "Patients view own requests" on enrollment_requests for select using (patient_id = (select id from patients where auth_user_id = auth.uid()));
create policy "Patients insert own requests" on enrollment_requests for insert with check (patient_id = (select id from patients where auth_user_id = auth.uid()));
create policy "Admins manage requests" on enrollment_requests for all using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients on delete cascade,
  course_id uuid references courses on delete cascade,
  status text check (status in ('active','completed')) default 'active',
  enrolled_at timestamptz default now(),
  completed_at timestamptz
);
alter table enrollments enable row level security;
create policy "Patients view own enrollments" on enrollments for select using (patient_id = (select id from patients where auth_user_id = auth.uid()));
create policy "Admins manage enrollments" on enrollments for all using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));

create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references enrollments on delete cascade,
  lesson_id uuid references lessons on delete cascade,
  completed boolean default false,
  completed_at timestamptz,
  unique (enrollment_id, lesson_id)
);
alter table lesson_progress enable row level security;
create policy "Patients manage own progress" on lesson_progress for all using (
  exists (select 1 from enrollments e where e.id = enrollment_id and e.patient_id = (select id from patients where auth_user_id = auth.uid()))
);
create policy "Admins view all progress" on lesson_progress for select using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons on delete cascade,
  title text not null
);
alter table quizzes enable row level security;
create policy "Admins manage quizzes" on quizzes for all using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes on delete cascade,
  question text not null,
  options jsonb not null,
  correct_answer text not null
);
alter table quiz_questions enable row level security;
create policy "Admins manage questions" on quiz_questions for all using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients on delete cascade,
  quiz_id uuid references quizzes on delete cascade,
  score int,
  answers jsonb,
  attempted_at timestamptz default now()
);
alter table quiz_attempts enable row level security;
create policy "Patients manage own attempts" on quiz_attempts for all using (patient_id = (select id from patients where auth_user_id = auth.uid()));
create policy "Admins view attempts" on quiz_attempts for select using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references enrollments on delete cascade,
  issued_at timestamptz default now()
);
alter table certificates enable row level security;
create policy "Patients view own certs" on certificates for select using (
  exists (select 1 from enrollments e where e.id = enrollment_id and e.patient_id = (select id from patients where auth_user_id = auth.uid()))
);
create policy "System insert certs" on certificates for insert with check (true);
create policy "Admins view all certs" on certificates for select using (exists (select 1 from patients p where p.auth_user_id = auth.uid() and p.role = 'admin'));

-- Auto-create patient record on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.patients (auth_user_id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
