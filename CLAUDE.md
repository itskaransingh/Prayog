# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Prayog is a Next.js 16 application for learning income tax compliance through hands-on simulation of government portals (EPAN, ITR). It uses Supabase for authentication and data storage, with a shadcn/ui component library styled with Tailwind CSS v4.

## Commands

```bash
bun dev      # Start development server (http://localhost:3000)
bun build    # Production build
bun start    # Start production server
bun lint     # Run ESLint
```

Tests use Node's built-in `node:test` module:
```bash
node --test __tests__/**/*.test.ts
```

## Architecture

### Route Groups

- `app/(lms)/` — LMS section with sidebar navigation, course/learning content pages
- `app/(simulation)/` — Tax simulation portals (epan-simulation, simulation sub-routes)
- `app/api/admin/` — Admin-only CRUD API routes for simulation tasks, steps, fields, questions
- `app/api/simulation/` — User-facing simulation API routes

### Authentication Flow

Middleware (`middleware.ts`) handles auth redirects:
- Unauthenticated users → `/login`
- Authenticated users hitting `/login` → `/`
- Non-admin users hitting `/dashboard` → `/`

Supabase SSR cookies are used for server-side auth. The client uses `createBrowserClient` from `@supabase/ssr`.

### API Route Pattern

Admin routes use `requireAdmin()` from `simulation-route-utils.ts` which returns `{ supabase, errorResponse }`. Early return on `errorResponse`. Cache invalidation uses `revalidateQuestionsTag()`.

### Key Libraries

- `lib/supabase/` — Client, server, and admin Supabase clients
- `lib/evaluation.ts` — Field scoring logic (accuracy, partial credit, time tracking)
- `lib/simulation/answer-field-generator.ts` — Generates DB field records from typed payloads (Classification, FinancialStatement, Grid, Registration, TrialBalance)
- `lib/simulation/fs-field-mapper.ts` — Legacy financial statement field mapping
- `lib/simulation/grid-field-mapper.ts` — Grid-type field mapping

### Component Organization

- `components/ui/` — shadcn/ui base components
- `components/simulation/income-tax/` — Simulation-specific components (epan-registration, itr-registration, shared)
- `components/lms/` — LMS-specific components (dashboard-grid, bottom-nav-bar, course-topics-sidebar, etc.)
- `components/admin/` — Admin components (qa-editor, simulation-answers-section, create-user-form)
- `components/branding/` — PrayogLogo

### Environment Variables

See `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to browser)
