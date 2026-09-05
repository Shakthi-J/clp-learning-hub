-- A revoked enrollment: access was taken away (a tier downgrade, or an admin
-- un-assigning a course pass) after the learner had already made progress -
-- worth keeping the row and their lesson_progress/certificates for the
-- record, but the lesson page and video/audio proxies must stop honouring
-- it. They only ever check status in ('active','completed'), so adding
-- 'revoked' as a third value blocks access everywhere automatically, with
-- no other code path needing to change.
--
-- Idempotent - safe to re-run.

alter table enrollments drop constraint if exists enrollments_status_check;
alter table enrollments add constraint enrollments_status_check
  check (status in ('active', 'completed', 'revoked'));
