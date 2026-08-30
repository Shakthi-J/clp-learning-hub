-- Instructor role: a third role alongside admin and patient.
-- Instructors author and manage only the courses assigned to them.
-- Idempotent — safe to re-run.

-- 1. Allow 'instructor' as a role value.
--    Handles `role` being a text/varchar column with a CHECK constraint (the common case).
--    If your `role` column is a Postgres ENUM instead, this block raises a notice and you
--    must run this ONE line on its own, outside any transaction, before re-running:
--        alter type <your_enum_name> add value 'instructor';
--    (ALTER TYPE ... ADD VALUE cannot legally run inside a DO block.)
do $$
declare
  kind char;
  enum_name text;
begin
  select t.typtype, t.typname
    into kind, enum_name
  from pg_attribute a
  join pg_type t on t.oid = a.atttypid
  where a.attrelid = 'patients'::regclass
    and a.attname = 'role'
    and a.attnum > 0;

  if kind = 'e' then
    if exists (
      select 1 from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = enum_name and e.enumlabel = 'instructor'
    ) then
      raise notice 'role enum % already has instructor', enum_name;
    else
      raise exception
        'role is enum %. Run this alone first: alter type % add value ''instructor'';',
        enum_name, enum_name;
    end if;
  else
    if exists (
      select 1 from pg_constraint
      where conrelid = 'patients'::regclass and conname = 'patients_role_check'
    ) then
      alter table patients drop constraint patients_role_check;
    end if;
    alter table patients add constraint patients_role_check
      check (role in ('admin', 'patient', 'instructor'));
  end if;
end $$;

-- 2. Course ownership. Null instructor_id = clinic-owned, admin-managed (all existing courses).
alter table courses
  add column if not exists instructor_id uuid references patients (id) on delete set null;

create index if not exists courses_instructor_id_idx on courses (instructor_id);

-- 3. Instructor profile fields, shown on course pages later.
alter table patients
  add column if not exists bio text,
  add column if not exists title text;

-- 4. RLS: instructors may read the patients rows of learners enrolled in their courses.
--    Named distinctly so it cannot collide with existing policies.
alter table patients enable row level security;

drop policy if exists "instructors read own course learners" on patients;
-- Must NOT select from `patients` here: a policy on `patients` that queries
-- `patients` re-enters its own RLS check and recurses. current_patient_id() is
-- a plpgsql SECURITY DEFINER function, so it resolves without that.
create policy "instructors read own course learners" on patients
  for select using (
    exists (
      select 1
      from enrollments e
      join courses c on c.id = e.course_id
      where e.patient_id = patients.id
        and c.instructor_id = current_patient_id()
    )
  );
