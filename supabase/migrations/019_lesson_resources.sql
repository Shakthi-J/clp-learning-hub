-- A downloadable attachment for a lesson note - a cookbook, a guideline PDF,
-- a checklist. Public bucket, same reasoning as quiz-images (017): these are
-- authoring materials referenced from a lesson's notes, not personal
-- documents, and this is not a paywalled marketplace - a signed-URL dance
-- would add nothing here.
--
-- Idempotent - safe to re-run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-resources', 'lesson-resources', true, 104857600, -- 100 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "lesson resources: anyone can read" on storage.objects;
create policy "lesson resources: anyone can read" on storage.objects
  for select using (bucket_id = 'lesson-resources');

drop policy if exists "lesson resources: staff can manage" on storage.objects;
create policy "lesson resources: staff can manage" on storage.objects
  for all using (bucket_id = 'lesson-resources' and is_staff())
  with check (bucket_id = 'lesson-resources' and is_staff());
