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

Project URL: https://dsoamvitlcgbomhiboug.supabase.co
Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb2Ftdml0bGNnYm9taGlib3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MzA3MDUsImV4cCI6MjEwNDAwNjcwNX0.WqufUZrLsI1csJCJsQLFsLbMf182J0m4CIo897CrJHA

Service role key: stored in .env.local as SUPABASE_SERVICE_ROLE_KEY
Never expose to client. Only use in api/ routes and server-only files.

---

## Environment Variables (.env.local)

NEXT_PUBLIC_SUPABASE_URL=https://dsoamvitlcgbomhiboug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb2Ftdml0bGNnYm9taGlib3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MzA3MDUsImV4cCI6MjEwNDAwNjcwNX0.WqufUZrLsI1csJCJsQLFsLbMf182J0m4CIo897CrJHA
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

Every patient has access_type: 'single_course' | 'selected_courses' | 'all_access'

- all_access: full catalog, nothing to grant.
- single_course / selected_courses: an admin (or the course's instructor, for
  their own courses) grants a "pass" to specific courses via the
  patient_course_access table (app/api/patients/[id]/courses/route.ts). A
  grant enrols the learner immediately (status 'active') — no request, no
  approval. single_course is capped at one granted course at a time in the
  UI (CourseAccessPicker's maxSelectable prop); selected_courses has no cap.

A pass is not a ceiling. On EITHER tier, a learner can still request any
course they were not given a pass for, through the normal catalog flow —
that lands in enrollment_requests for an admin to approve or reject, same
as before. api/enrollments/request/route.ts only blocks a request when the
learner already holds an active/completed enrollment for that exact course
(pass-granted or previously approved) — it does not gate on access_type.

Client-side gating is UX only — never rely on it as the security gate.

---

## Enrollment Lifecycle

requested → approved → completed
requested → rejected

enrollment_requests table holds the workflow.
enrollments table holds only approved/active/completed records.
Do not conflate the two tables.

---

## Design Tokens

White/neutral base with a multi-colour accent system. All tokens live in
`app/globals.css` (light in `:root`, dark in `.dark`).

Base
  Background:           #f8fafc
  Card:                 #ffffff
  Card secondary:       #f1f5f9
  Border:               #e2e8f0
  Foreground:           #0f172a
  Foreground secondary: #64748b
  Foreground muted:     #94a3b8

Brand
  Primary:              #2e7d32
  Primary hover:        #256a29
  Primary light:        #dcefd7
  Secondary:            #a8d5a2

Status (each has a matching -light background token)
  Success:              #16a34a
  Warning:              #d97706
  Danger:               #dc2626
  Info:                 #0284c7

Accents (each has a matching -light token) - used for categories and badges
  blue #2563eb · purple #7c3aed · teal #0d9488
  rose #e11d48 · amber #d97706 · indigo #4f46e5

Radius lg:              18px
Font:                   Inter, ui-sans-serif, system-ui, sans-serif

Never hardcode hex in components - always use the CSS variables.
Course categories get a colour automatically via `lib/categoryColor.ts`, which
hashes the category name to a stable accent hue. Do not assign these by hand.

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
