-- Lets a quiz or assessment question carry an illustration - a nutrition
-- label, a molecule diagram, a chart the question refers to. Several
-- questions already imported reference "the picture attached" with nowhere
-- for the picture to actually go.
--
-- Public bucket, not the private pattern used for assignment-files: these are
-- authoring illustrations shown to every enrolled learner taking the quiz,
-- not personal documents. A signed-URL dance would add nothing here.
--
-- Idempotent - safe to re-run.

alter table quiz_questions add column if not exists image_path text;
alter table assessment_questions add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quiz-images', 'quiz-images', true, 5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket: anyone can read (that's the point - it's rendered on a quiz
-- page), but writes are staff-only, same rule as everything else authored.
drop policy if exists "quiz images: anyone can read" on storage.objects;
create policy "quiz images: anyone can read" on storage.objects
  for select using (bucket_id = 'quiz-images');

drop policy if exists "quiz images: staff can manage" on storage.objects;
create policy "quiz images: staff can manage" on storage.objects
  for all using (bucket_id = 'quiz-images' and is_staff())
  with check (bucket_id = 'quiz-images' and is_staff());
