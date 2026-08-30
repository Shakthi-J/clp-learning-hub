-- Lets instructors create their own courses, and records who created each one.
--
-- created_by is deliberately separate from instructor_id: instructor_id is the
-- current owner and an admin may reassign it, while created_by is an immutable
-- record of authorship that admins can always see.
--
-- Idempotent - safe to re-run.

alter table courses
  add column if not exists created_by uuid references patients (id) on delete set null;

create index if not exists courses_created_by_idx on courses (created_by);

-- Existing courses: the assigned instructor is the best available author.
update courses set created_by = instructor_id
where created_by is null and instructor_id is not null;

-- An instructor may create a course only with themselves as owner and author,
-- so nobody can create work in someone else's name.
drop policy if exists "instructors create own courses" on courses;
create policy "instructors create own courses" on courses
  for insert with check (
    current_user_role() = 'instructor'
    and instructor_id = current_patient_id()
    and created_by = current_patient_id()
  );

-- Reassignment stays an admin action, but an instructor must not be able to
-- rewrite authorship on a course they own either. Enforced in the API; this
-- trigger is the backstop for direct table writes.
create or replace function public.protect_course_authorship() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_admin() then
    return new;
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed';
  end if;
  if new.instructor_id is distinct from old.instructor_id then
    raise exception 'instructor_id can only be changed by an admin';
  end if;
  return new;
end $$;

drop trigger if exists courses_protect_authorship on courses;
create trigger courses_protect_authorship
  before update on courses
  for each row execute function public.protect_course_authorship();
