# Milestone 4 Delegation & Instructions (PRD)

This document serves as the primary Product Requirements Document (PRD) and instruction manual for executing Milestone 4: Backend-Driven LMS & Admin Flow.

> **CRITICAL INSTRUCTION FOR ALL AGENTS**
> You must strictly follow the workflow outlined in `@[.agents/workflows/coding-agent-workflow.md]`. Specifically:
> - Review this PRD before starting.
> - Build on the work of the preceding agent (Agent 1 -> 2 -> 3 -> 4).
> - Use Tailwind + Shadcn for LMS `(lms)`.
> - After completion, you must comment on your Linear issue detailing the work and mark the ticket as "Done".

---

## 🚀 PRA-35: Agent 1 - DB Schema & Admin Panel (Modules/Submodules)
**Goal:** Build the backend foundation for LMS Modules.
**Tasks:**
1. Setup Supabase tables for `modules` (id, title, slug, course_count, icon_name, bg_color, text_color, progress).
2. Setup Supabase tables for `submodules` (id, module_id, title, slug, task_count, progress).
3. Create API query functions in `lib/supabase/` to fetch/insert/update these entries.
4. Construct a new private route `/dashboard/admin/content/modules` using Tailwind + Shadcn. Create a simple UI to add/edit/delete modules and their linked submodules.

---

## 🚀 PRA-36: Agent 2 - DB Schema & Admin Panel (Questions & Answers)
**Goal:** Build the backend schema and admin editor for the Case Studies.
**Tasks:**
1. Setup Supabase tables for `questions` (id, submodule_id, title, paragraph, has_table, table_data (jsonb), has_image, image_url).
2. Setup Supabase tables for `answers`/`evaluation_criteria` (id, question_id, evaluation_data (jsonb)).
3. Create API query functions in `lib/supabase/` for these schemas.
4. Extend the Admin panel `/dashboard/admin/content/questions` to allow dynamic creation of the paragraph, table inputs, image inputs, and mapping the correct ground-truth answers for the simulation.

---

## 🚀 PRA-37: Agent 3 - Frontend LMS Integration
**Goal:** Migrate the frontend to fetch static modules/submodules from the backend seamlessly.
**Tasks:**
1. Modify `app/(lms)/learning-contents/page.tsx` to fetch `modules` from Supabase (instead of the hardcoded `LEARNING_CONTENTS`). 
2. Replace hardcoded `app/(lms)/learning-contents/income-tax` with a dynamic route `app/(lms)/learning-contents/[moduleSlug]/page.tsx`.
3. Fetch `submodules` by `moduleSlug`.
4. **UI Rule:** Do not change the existing UI card styles, progress bars, or icon mapping. Ensure the `index + 1` number UI is retained exactly as before.

---

## 🚀 PRA-38: Agent 4 - Frontend Case Study & Evaluation Link
**Goal:** Dynamically render the Case Study questions and wire the evaluation engine.
**Tasks:**
1. Replace hardcoded `app/(lms)/course/income-tax/page.tsx` with dynamic routing `app/(lms)/course/[submoduleSlug]/page.tsx`.
2. Fetch the question data via Supabase queries.
3. Update `components/lms/case-study-content.tsx` to rely on props.
4. Render using the exact hierarchy: Paragraph -> Table (if `has_table` and `table_data` exists) -> Image (if `has_image` and `image_url` exists). Do not alter the aesthetic bounds.
5. Update `lib/evaluation.ts` (or relevant logic) to use the database ground truth (`answers` table) instead of hardcoded constants for evaluating the simulation outcome.
