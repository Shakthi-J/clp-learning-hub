-- Grants the Supabase roles access to the public schema.
--
-- 000 created every table but never granted anything, so on a freshly created
-- project PostgREST answers `42501 permission denied` for even the service
-- role. The original project had these grants from however it was first built;
-- recreating the project from these migrations alone did not.
--
-- This is the standard Supabase posture: the roles hold table privileges and
-- row level security decides what any given caller may actually see. Every
-- table in this schema has RLS enabled (see 000, 002, 003, 009, 010), so
-- granting here does not widen access - without it, nothing works at all.
--
-- Idempotent - safe to re-run.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Anything created later inherits the same grants, so a new table added in a
-- future migration does not silently become unreadable.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
