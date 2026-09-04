-- Internal staff training: how the team uses its own tools (PTD, Calendly,
-- Canva, client workflows). Deliberately separate from courses/modules/
-- lessons rather than reusing them with a flag - training has no enrollment,
-- no certificate, no quiz, and must never be reachable by a learner. Keeping
-- it a distinct set of tables means the existing patient-facing RLS on
-- courses/lessons is never in the path, so there is nothing to accidentally
-- expose to a learner as this evolves.
--
-- Every table here is staff-only, gated by the same is_staff() helper the
-- rest of the schema already uses.
--
-- Idempotent - safe to re-run.

create table if not exists training_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  "order" integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists training_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references training_modules (id) on delete cascade,
  title text not null,
  "order" integer not null default 1,
  drive_file_id text,
  notes text,
  created_at timestamptz not null default now()
);

-- Who has watched what. Optional in the UI, but useful once there is more
-- than a couple of staff and someone wants to know who has completed
-- onboarding.
create table if not exists training_progress (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references training_lessons (id) on delete cascade,
  patient_id uuid not null references patients (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (lesson_id, patient_id)
);

alter table training_modules enable row level security;
alter table training_lessons enable row level security;
alter table training_progress enable row level security;

drop policy if exists "training modules: staff only" on training_modules;
create policy "training modules: staff only" on training_modules
  for all using (is_staff()) with check (is_staff());

drop policy if exists "training lessons: staff only" on training_lessons;
create policy "training lessons: staff only" on training_lessons
  for all using (is_staff()) with check (is_staff());

-- Each staff member manages their own completion record; any staff member can
-- see the whole list, which is what makes an admin's completion overview
-- possible.
drop policy if exists "training progress: staff can read all" on training_progress;
create policy "training progress: staff can read all" on training_progress
  for select using (is_staff());

drop policy if exists "training progress: mark own completion" on training_progress;
create policy "training progress: mark own completion" on training_progress
  for insert with check (is_staff() and patient_id = current_patient_id());

drop policy if exists "training progress: clear own completion" on training_progress;
create policy "training progress: clear own completion" on training_progress
  for delete using (is_staff() and patient_id = current_patient_id());
