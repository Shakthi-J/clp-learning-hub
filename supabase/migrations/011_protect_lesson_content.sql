-- Stops lesson rows, and with them every YouTube video id, from being readable
-- by anyone who is not enrolled.
--
-- The policy written in 000 granted a full row read whenever the course was
-- published. Since the anon key is public by design, that meant an anonymous
-- visitor could query the lessons table directly and collect youtube_video_id
-- and notes for every published course - the app gated the lesson *page*, but
-- never the data behind it.
--
-- Curriculum previews on the public course page now come from a view that
-- exposes titles and ordering only, so the catalog still works.
--
-- Idempotent - safe to re-run.

-- 1. Lesson rows: enrolled learners and staff only.
drop policy if exists "read lessons of visible courses" on lessons;
drop policy if exists "read lessons when entitled" on lessons;
create policy "read lessons when entitled" on lessons
  for select using (
    is_staff()
    or exists (
      select 1
      from modules m
      join enrollments e on e.course_id = m.course_id
      where m.id = lessons.module_id
        and e.patient_id = current_patient_id()
    )
  );

-- 2. Public curriculum: titles and ordering, never the video id or notes.
create or replace view public_curriculum
with (security_invoker = off) as
select
  c.id           as course_id,
  c.slug         as course_slug,
  m.id           as module_id,
  m.title        as module_title,
  m."order"      as module_order,
  l.id           as lesson_id,
  l.title        as lesson_title,
  l."order"      as lesson_order
from courses c
join modules m on m.course_id = c.id
left join lessons l on l.module_id = m.id
where c.published;

grant select on public_curriculum to anon, authenticated;
