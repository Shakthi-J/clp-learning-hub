-- Fixes the actual cause of "infinite recursion detected in policy for
-- relation patients".
--
-- 002 added this policy on `patients`:
--
--   ... join patients me on me.id = c.instructor_id
--       where me.auth_user_id = auth.uid()
--
-- A policy on `patients` that itself selects from `patients` re-enters its own
-- RLS check, so any read of the table recursed. current_patient_id() is a
-- plpgsql SECURITY DEFINER function, so calling it resolves the instructor
-- without touching `patients` inside the policy.
-- Idempotent - safe to re-run.

drop policy if exists "instructors read own course learners" on patients;
create policy "instructors read own course learners" on patients
  for select using (
    exists (
      select 1
      from enrollments e
      join courses c on c.id = e.course_id
      where e.patient_id = patients.id
        and c.instructor_id = current_patient_id()
    )
  );
