-- Makes the certificate design and wording editable by admins.
--
-- Everything on the certificate was hardcoded in the component, so changing the
-- organisation name, the wording, or adding a signature meant a code deploy.
-- A single-row table holds it instead.
--
-- Idempotent - safe to re-run.

create table if not exists certificate_template (
  -- Single row: the primary key can only ever be true.
  id boolean primary key default true check (id),

  organisation_name text not null default 'Clinic Living Plus',
  logo_initials text not null default 'CL',

  title text not null default 'Certificate of Completion',
  intro_line text not null default 'This certifies that',
  middle_line text not null default 'has successfully completed',
  footer_note text,

  signature_name text,
  signature_role text,

  accent_color text not null default '#2e7d32',

  show_category boolean not null default true,
  show_issued_date boolean not null default true,
  show_certificate_number boolean not null default true,
  show_signature boolean not null default false,

  updated_at timestamptz not null default now(),
  updated_by uuid references patients (id) on delete set null
);

-- Seed the single row.
insert into certificate_template (id) values (true) on conflict (id) do nothing;

alter table certificate_template enable row level security;

-- Readable by everyone: the public verification page renders a certificate
-- without a session.
drop policy if exists "anyone reads certificate template" on certificate_template;
create policy "anyone reads certificate template" on certificate_template
  for select using (true);

-- Only admins may change how certificates look. Instructors are deliberately
-- excluded: the template is clinic-wide, not per-course.
drop policy if exists "admins write certificate template" on certificate_template;
create policy "admins write certificate template" on certificate_template
  for all using (is_admin()) with check (is_admin());
