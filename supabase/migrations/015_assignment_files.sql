-- Lets a learner attach a file to an assignment submission, alongside the
-- existing text response.
--
-- Files live in a private Storage bucket, never a public one. Path shape is
-- {auth_user_id}/{assignment_id}/{filename}, so storage's own RLS can key off
-- the first path segment without a join back to patients - the same pattern
-- Postgres RLS uses via current_patient_id(), just expressed for storage.
--
-- Idempotent - safe to re-run.

alter table assignment_submissions add column if not exists file_path text;
alter table assignment_submissions add column if not exists file_name text;
alter table assignment_submissions add column if not exists file_size integer;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assignment-files',
  'assignment-files',
  false,
  20971520, -- 20 MB
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "assignment files: owner can manage" on storage.objects;
create policy "assignment files: owner can manage" on storage.objects
  for all using (
    bucket_id = 'assignment-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'assignment-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "assignment files: staff can read" on storage.objects;
create policy "assignment files: staff can read" on storage.objects
  for select using (
    bucket_id = 'assignment-files'
    and is_staff()
  );
