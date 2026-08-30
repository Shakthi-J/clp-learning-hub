-- Fixes "infinite recursion detected in policy for relation patients".
--
-- The helpers in 000 were `language sql`. Postgres inlines plain SQL functions
-- into the calling query, which drops the SECURITY DEFINER context - so a
-- policy on `patients` that called is_staff() ended up querying `patients`
-- again and re-entering its own policy.
--
-- plpgsql functions are never inlined, so the definer context survives and the
-- lookup bypasses RLS as intended.
-- Idempotent - safe to re-run.

create or replace function public.current_patient_id() returns uuid
language plpgsql stable security definer set search_path = public as $$
declare
  result uuid;
begin
  select id into result from patients where auth_user_id = auth.uid() limit 1;
  return result;
end $$;

create or replace function public.current_user_role() returns text
language plpgsql stable security definer set search_path = public as $$
declare
  result text;
begin
  select role into result from patients where auth_user_id = auth.uid() limit 1;
  return result;
end $$;

create or replace function public.is_staff() returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  result text;
begin
  select role into result from patients where auth_user_id = auth.uid() limit 1;
  return coalesce(result in ('admin', 'instructor'), false);
end $$;

create or replace function public.is_admin() returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  result text;
begin
  select role into result from patients where auth_user_id = auth.uid() limit 1;
  return coalesce(result = 'admin', false);
end $$;
