-- Lets a lesson hold a Google Drive file instead of a YouTube video.
--
-- Both columns coexist on purpose: existing lessons keep working on YouTube
-- while new ones can be moved to Drive one at a time. The player prefers the
-- Drive file when both are set.
--
-- Nothing here is public. The id is only ever read by the server, which checks
-- the enrollment before it fetches anything from Drive, and the lesson row is
-- already restricted to enrolled learners and staff by migration 011.
--
-- Idempotent - safe to re-run.

alter table lessons add column if not exists drive_file_id text;

comment on column lessons.drive_file_id is
  'Google Drive file id. Served through /api/lessons/[lessonId]/video, never linked directly.';
