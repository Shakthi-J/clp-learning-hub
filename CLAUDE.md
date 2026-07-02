# CLP Learning Hub — Claude Memory File

Read this at the start of every session. Do not skip any section.

---

## Project Overview

CLP Learning Hub is a patient education platform for Clinic Living Plus (CLP).
Patients browse courses, request enrollment, complete video-based lessons with
quizzes, and earn certificates. Access is gated by the patient's access tier,
set manually by an Admin.

This is NOT a marketplace. It is a controlled educational portal.
There are no payments, no subscriptions, no public signups that bypass staff control.

---

## Tech Stack

- Framework: Next.js 15 (App Router) + TypeScript — strict mode on
- Styling: Tailwind CSS v4 + custom CSS variables (see design system below)
- Backend: Supabase (Postgres + Auth + RLS)
- Video: YouTube IFrame Player API — unlisted videos only, never stored in Supabase
- Deployment: Vercel Hobby (free tier)
- Domain: learn.cliniclivingplus.com
- Email: Resend (transactional, free tier) wired into Supabase Auth

---

## Supabase

Project URL: https://vgzxzxpfymhttrxvpjeq.supabase.co
Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnenh6eHBmeW1odHRyeHZwamVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMDUyMjEsImV4cCI6MjA5NzY4MTIyMX0.GZ2Scrj0jiPoj-Nknl4fVJyFM2sD0c7Vt1MrG2V4leU

Service role key: stored in .env.local as SUPABASE_SERVICE_ROLE_KEY
Never expose to client. Only use in api/ routes and server-only files.

---

## Environment Variables (.env.local)

NEXT_PUBLIC_SUPABASE_URL=https://vgzxzxpfymhttrxvpjeq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnenh6eHBmeW1odHRyeHZwamVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMDUyMjEsImV4cCI6MjA5NzY4MTIyMX0.GZ2Scrj0jiPoj-Nknl4fVJyFM2sD0c7Vt1MrG2V4leU
SUPABASE_SERVICE_ROLE_KEY=<paste from Supabase dashboard>
RESEND_API_KEY=<paste from Resend dashboard>
NEXT_PUBLIC_SITE_URL=https://learn.cliniclivingplus.com

---

## Roles

- Admin — CLP staff. Full CRUD on courses/lessons. Reviews enrollments. Sets access tiers.
- Patient — browses catalog, requests enrollment, watches lessons, takes quizzes, earns certificates.

Do NOT build an Educator role in v1.

---

## Access Tier Logic

Every patient has access_type: 'single_course' | 'all_access'

- all_access: no restriction on concurrent enrollments.
- single_course: blocked from requesting a new enrollment while any enrollment is 'active'.
  Once all active enrollments reach 'completed', new requests are allowed.

This check MUST be enforced server-side in api/enrollments/request/route.ts.
Client-side gating is UX only — never rely on it as the security gate.

---

## Enrollment Lifecycle

requested → approved → completed
requested → rejected

enrollment_requests table holds the workflow.
enrollments table holds only approved/active/completed records.
Do not conflate the two tables.

---

## Design Tokens (exact from MicrobiomeRx — use verbatim)

Primary green:        #2e7d32
Primary hover:        #256a29
Primary light:        #dcefd7
Secondary:            #a8d5a2
Background:           #f8f4ea
Card:                 #fffdf8
Card secondary:       #f3f8ef
Beige:                #e8dfc9
Foreground:           #1f2937
Foreground secondary: #6b7280
Foreground muted:     #9ca3af
Border:               #e8dfc9
Radius lg:            18px
Font:                 Inter, ui-sans-serif, system-ui, sans-serif

Never hardcode hex in components. Always use CSS variables.

---

## Video Rules

- YouTube IFrame Player API only — never a bare iframe
- Store only the video ID string in lessons.youtube_video_id
- Videos are unlisted on YouTube — app controls access, not YouTube

---

## Build Rules

1. Complete file replacements only — never partial patches
2. All hooks must be declared before any conditional return
3. Server components are the default — add 'use client' only when needed
4. API routes must validate the user's role before any write operation
5. Never put SUPABASE_SERVICE_ROLE_KEY in client-facing files

---

## Out of Scope for v1

- knowledge_sessions library
- resources/downloads library
- Recommended next course engine
- Educator role
- programs/patient_programs tables
