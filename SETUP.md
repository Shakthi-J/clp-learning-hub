# CLP Learning Hub — Setup Guide

## IMPORTANT — Folder Name Change
The downloaded folder uses safe names instead of Next.js special syntax.
You MUST rename them after copying into your project:

  public-routes   →   (public)
  patient-routes  →   (patient)
  admin-routes    →   (admin)
  courseSlug      →   [courseSlug]
  lessonSlug      →   [lessonSlug]
  certificateId   →   [certificateId]
  courseId        →   [courseId]
  lessonId        →   [lessonId]
  patientId       →   [patientId]
  id (in api/enrollments/id) → [id]

---

## Step 1 — Create the Next.js project

Open PowerShell and run:

  npx create-next-app@latest clp-learning-hub --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
  cd clp-learning-hub

---

## Step 2 — Copy all files from this download into the project

Replace any files that already exist. Then rename the folders above.

---

## Step 3 — Install Supabase packages

  npm install @supabase/ssr @supabase/supabase-js

---

## Step 4 — Set up .env.local

  cp .env.example .env.local

Open .env.local and fill in:
  SUPABASE_SERVICE_ROLE_KEY  — from Supabase → Settings → API
  RESEND_API_KEY             — from resend.com

---

## Step 5 — Run the database schema

1. Go to supabase.com → your project → SQL Editor
2. Open supabase/schema.sql
3. Paste entire contents → Run
4. Confirm no errors

---

## Step 6 — Run locally

  npm run dev

Open http://localhost:3000

---

## Step 7 — Set yourself as admin

1. Go to http://localhost:3000/login → enter your email → click magic link
2. Go to Supabase → Table Editor → patients
3. Find your row → Edit → set role to "admin" → Save
4. Refresh the app → you'll be redirected to /admin

---

## Step 8 — Deploy to Vercel

  git init
  git add .
  git commit -m "Phase 1 scaffold"
  git remote add origin https://github.com/YOUR_USERNAME/clp-learning-hub.git
  git push -u origin main

In Vercel:
  New Project → Import clp-learning-hub repo
  Add all 5 env variables from .env.local
  Deploy

---

## Step 9 — Add custom domain

In Vercel → Settings → Domains → Add: learn.cliniclivingplus.com
Add the CNAME record Vercel gives you to your DNS registrar.

---

## Phase 1 is complete when:

  ✓ npm run dev runs without errors
  ✓ Homepage loads at localhost:3000
  ✓ Login sends a magic link
  ✓ Clicking the link redirects to /my-learning
  ✓ After setting role=admin, redirects to /admin
  ✓ Deployed to Vercel with custom domain live
