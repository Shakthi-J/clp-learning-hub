-- Certificates: numbering, issue date, and public verification support.
-- Idempotent — safe to re-run.

alter table certificates
  add column if not exists certificate_number text,
  add column if not exists issued_at timestamptz not null default now();

-- Backfill any rows created before numbering existed.
update certificates
set certificate_number = 'CLP-' || to_char(coalesce(issued_at, now()), 'YYYY') || '-' ||
                         upper(substr(replace(id::text, '-', ''), 1, 8))
where certificate_number is null;

alter table certificates alter column certificate_number set not null;

create unique index if not exists certificates_number_key
  on certificates (certificate_number);

-- One certificate per enrollment.
create unique index if not exists certificates_enrollment_key
  on certificates (enrollment_id);

-- Patients may read their own certificates.
alter table certificates enable row level security;

drop policy if exists "patients read own certificates" on certificates;
create policy "patients read own certificates" on certificates
  for select using (
    enrollment_id in (
      select e.id from enrollments e
      join patients p on p.id = e.patient_id
      where p.auth_user_id = auth.uid()
    )
  );
