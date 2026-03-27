# Milestone 5 Delegation & Instructions (PRD)

This document serves as the primary Product Requirements Document (PRD) and instruction manual for executing Milestone 5: EPAN Registration Simulator & Reorganization.

> **CRITICAL INSTRUCTION FOR ALL AGENTS**
> You must strictly follow the workflow outlined in `@[.agents/workflows/coding-agent-workflow.md]`. Specifically:
> - Review this PRD before starting.
> - Build on the work of the preceding agent (Agent 1 -> 2 -> 3 -> 4 -> 5).
> - Use Tailwind + Shadcn for LMS `(lms)`.
> - Use **vanilla CSS** for the Simulation views `(simulation)` to perfectly mimic the government portal.
> - After completion, you must comment on your Linear issue detailing the work and mark the ticket as "Done".

---

## 🚀 PRA-39: Agent 1 - Component Reorganization into Submodule Folders
**Goal:** Reorganize all simulation and LMS components into an `Income Tax/` folder structure with submodule subfolders. This is the foundation for all subsequent agents.
**Tasks:**
1. Create folder structure (`components/simulation/income-tax/epan-registration`, `itr-registration`, and `shared`).
2. Move the 9 existing simulation components from `components/simulation/` into the appropriate subfolders (e.g., `registration-form.tsx` to `itr-registration`, `portal-header.tsx` to `shared`).
3. Set up the context and constant files in `lib/simulation/itr-registration/`.
4. Update ALL imports across the entire codebase.
5. Verify that `npm run build` passes with zero errors and the existing ITR Simulation works flawlessly.

---

## 🚀 PRA-40: Agent 2 - EPAN Simulation UI (Replicate NergyVidya)
**Goal:** Build the complete E-PAN Registration simulator UI replicating the NergyVidya "Instant E-PAN" interface exactly using vanilla CSS.
**Tasks:**
1. Build the 4-step UI components in `components/simulation/income-tax/epan-registration/`:
    - `epan-aadhaar-form.tsx` (Step 1 - Enter Aadhaar & Checkbox)
    - `epan-consent-otp.tsx` (Step 2 - Consent & OTP Validation with 6-digit auto-tab inputs)
    - `epan-validate-details.tsx` (Step 3 - Read-only Aadhaar details table & Email OTP modal)
    - `epan-confirm-submit.tsx` (Step 4 - Details summary & Submission success banner)
2. Build the reusable `epan-otp-input.tsx` for the 6-digit inputs.
3. Write vanilla CSS styling in `app/(simulation)/epan-simulation.css` mimicking the government portal (Navy header, light gray background, white cards).
4. Reuse shared components (`portal-header`, `portal-footer`, `progress-stepper`).

---

## 🚀 PRA-41: Agent 3 - EPAN Simulation State Management & Logic
**Goal:** Build the EPAN registration context, state management, evaluation logic, and wire the simulation page.
**Tasks:**
1. Create `lib/simulation/epan-registration/epan-context.tsx` with the `EPANData` structure, Navigation hooks, and Data update functions.
2. Create `constants.ts` for EPAN (steps definition, validation regexes).
3. Connect the evaluation logic using the existing `lib/evaluation.ts` framework checking Aadhaar number, Mobile OTP, and Email OTP mappings.
4. Create the main `app/(simulation)/epan-simulation/page.tsx` rendering the step components based on Context state.
5. Provide the evaluation popup logic on completion.

---

## 🚀 PRA-42: Agent 4 - Backend Database & EPAN Seed Data
**Goal:** Populate the Supabase database with EPAN Registration submodule data, case study questions, and evaluation answer keys.
**Tasks:**
1. Insert the "E-PAN Registration" submodule into the `submodules` table (sort_order = 1) under Income Tax.
2. Update the existing ITR Registration submodule sort_order from 1 to 2.
3. Create 5 distinct Case Study questions (e.g., EPAN_ICAI_01) in the `questions` table featuring an `image_url` for the Aadhaar card.
4. Create the corresponding `simulation_tasks`, `simulation_steps` (4 per task), and `simulation_fields` (answer keys: aadhaarNumber, aadhaarOtp, emailOtp).
5. Write an idempotent SQL seed script safely placed in `scripts/seed-epan-data.sql`.

---

## 🚀 PRA-43: Agent 5 - Routing, Integration & End-to-End Polish
**Goal:** Wire everything together: LMS navigation → EPAN simulation → Evaluation → back to LMS.
**Tasks:**
1. Update `app/(lms)/course/[submoduleSlug]/page.tsx` to conditionally route "Start Task" to `/epan-simulation?questionId=...`.
2. Update the LMS sidebar `components/lms/course-topics-sidebar.tsx` to fetch/display EPAN questions and enable Next/Prev navigation correctly.
3. Set up the `/epan-simulation/gateway` (or update `/simulation/gateway`).
4. Wire the back navigation after evaluation completion back to the LMS.
5. End-to-end regression check to guarantee ITR Registration isn't broken, all links work, and `npm run build` succeeds smoothly.
