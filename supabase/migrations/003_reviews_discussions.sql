-- Course reviews and lesson discussions.
-- Idempotent — safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Course reviews
-- ---------------------------------------------------------------------------
create table if not exists course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  patient_id uuid not null references patients (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One review per person per course; re-reviewing edits the existing row.
create unique index if not exists course_reviews_course_patient_key
  on course_reviews (course_id, patient_id);
create index if not exists course_reviews_course_idx
  on course_reviews (course_id, created_at desc);

-- Denormalised aggregates so the catalog can sort and display without a join.
alter table courses
  add column if not exists avg_rating numeric(3,2) not null default 0,
  add column if not exists review_count integer not null default 0;

create or replace function refresh_course_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target uuid := coalesce(new.course_id, old.course_id);
begin
  update courses c
  set avg_rating = coalesce((select round(avg(r.rating)::numeric, 2) from course_reviews r where r.course_id = target), 0),
      review_count = (select count(*) from course_reviews r where r.course_id = target)
  where c.id = target;
  return null;
end $$;

drop trigger if exists course_reviews_aggregate on course_reviews;
create trigger course_reviews_aggregate
  after insert or update or delete on course_reviews
  for each row execute function refresh_course_rating();

-- Backfill for any rows that predate the trigger.
update courses c
set avg_rating = coalesce((select round(avg(r.rating)::numeric, 2) from course_reviews r where r.course_id = c.id), 0),
    review_count = (select count(*) from course_reviews r where r.course_id = c.id);

alter table course_reviews enable row level security;

-- Reviews are public: anyone browsing the catalog can read them.
drop policy if exists "anyone reads reviews" on course_reviews;
create policy "anyone reads reviews" on course_reviews
  for select using (true);

-- Writes go through the API, which checks enrollment. This policy is the backstop.
drop policy if exists "patients write own reviews" on course_reviews;
create policy "patients write own reviews" on course_reviews
  for all using (
    patient_id in (select id from patients where auth_user_id = auth.uid())
  ) with check (
    patient_id in (select id from patients where auth_user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 2. Lesson discussions
-- ---------------------------------------------------------------------------
create table if not exists lesson_comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons (id) on delete cascade,
  patient_id uuid not null references patients (id) on delete cascade,
  parent_id uuid references lesson_comments (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists lesson_comments_lesson_idx
  on lesson_comments (lesson_id, created_at);
create index if not exists lesson_comments_parent_idx
  on lesson_comments (parent_id);

alter table lesson_comments enable row level security;

-- Readable by people enrolled in the course the lesson belongs to, plus staff.
drop policy if exists "enrolled read lesson comments" on lesson_comments;
create policy "enrolled read lesson comments" on lesson_comments
  for select using (
    exists (
      select 1
      from lessons l
      join modules m on m.id = l.module_id
      join enrollments e on e.course_id = m.course_id
      join patients p on p.id = e.patient_id
      where l.id = lesson_comments.lesson_id
        and p.auth_user_id = auth.uid()
    )
    or exists (
      select 1 from patients me
      where me.auth_user_id = auth.uid()
        and me.role in ('admin', 'instructor')
    )
  );

drop policy if exists "authors write own comments" on lesson_comments;
create policy "authors write own comments" on lesson_comments
  for all using (
    patient_id in (select id from patients where auth_user_id = auth.uid())
  ) with check (
    patient_id in (select id from patients where auth_user_id = auth.uid())
  );
