-- Prevents a learner holding two active enrollments in the same course.
--
-- The lesson page resolves the enrollment with .single(), which throws when two
-- rows match, so a duplicate silently redirected the learner away from every
-- lesson in that course. Nothing stopped a second enrollment being created.
--
-- Idempotent - safe to re-run.

-- 1. Clean up existing duplicates.
--    Deliberately conservative: only ever deletes a row that has no progress,
--    no certificate, and is not the oldest of its group. A duplicate holding
--    any learner work is left alone for a human to reconcile.
with ranked as (
  select
    e.id,
    row_number() over (
      partition by e.patient_id, e.course_id
      order by e.enrolled_at
    ) as rn
  from enrollments e
  where e.status = 'active'
),
deletable as (
  select r.id
  from ranked r
  where r.rn > 1
    and not exists (select 1 from lesson_progress lp where lp.enrollment_id = r.id)
    and not exists (select 1 from certificates c where c.enrollment_id = r.id)
)
delete from enrollments where id in (select id from deletable);

-- 2. Stop it happening again. A partial index, so re-enrolling after finishing
--    a course still works - completed rows do not participate in the constraint.
create unique index if not exists enrollments_one_active_per_course
  on enrollments (patient_id, course_id)
  where status = 'active';
