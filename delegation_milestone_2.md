# Delegation Document — Milestone 2: Complete Registration Flow & Evaluation

**Project:** Prayog Prototype: ITR Registration  
**Milestone:** Milestone 2: Complete Registration Flow & Evaluation  
**Total Agents:** 3 (sequential execution)

---

## Pre-requisites

- Milestone 1 is **complete** ✅ — LMS wrapper and Step 1 simulation are built
- The Next.js app runs at `localhost:3000`
- Tech stack: Next.js App Router, TypeScript, Shadcn + Tailwind for `(lms)`, Vanilla CSS for `(simulation)`

---

## Agent 1 — Foundation + Step 2

**Issues:** [PRA-3](https://linear.app/atomnik/issue/PRA-3) + [PRA-4](https://linear.app/atomnik/issue/PRA-4)

**Context:**  
This agent sets up the multi-step state management architecture that all subsequent agents will build upon, and then implements the Step 2 "Fill Details" form.

**Tasks:**
1. **PRA-3: Implement Multi-Step State Management & Navigation** (Urgent)
   - Refactor `app/(simulation)/simulation/page.tsx` into a step-aware container
   - Create shared state (React context or lifted state) for all registration data
   - Make the progress stepper dynamic (current/completed states)
   - Wire Step 1 `onContinue` → Step 2 transition
   - Add back navigation between steps
   - Define ground-truth constants for evaluation

2. **PRA-4: Build Step 2 — Fill Details Forms** (High)
   - Create `components/simulation/fill-details-form.tsx` (Vanilla CSS only)
   - Three sections: Personal Details, Address Details, Contact Details
   - Client-side validations (DOB, pincode, mobile, email)
   - Continue → Step 3, Back → Step 1

---

## Agent 2 — Steps 3 & 4

**Issues:** [PRA-5](https://linear.app/atomnik/issue/PRA-5) + [PRA-6](https://linear.app/atomnik/issue/PRA-6)

**Context:**  
This agent builds the OTP verification and password creation screens. Both are form-heavy but smaller than Step 2. The multi-step infrastructure from Agent 1 is already in place.

**Tasks:**
1. **PRA-5: Build Step 3 — OTP Verification Flow** (High)
   - Create `components/simulation/otp-verification-form.tsx` (Vanilla CSS only)
   - Show submitted details summary (read-only)
   - Simulated OTP for Mobile + Email (hint the OTP to students)
   - 6-digit validation + 30s resend cooldown timer
   - Continue → Step 4, Back → Step 2

2. **PRA-6: Build Step 4 — Password Creation & Account Security** (High)
   - Create `components/simulation/password-creation-form.tsx` (Vanilla CSS only)
   - Password + Confirm Password with real-time rule checklist
   - Show/hide toggle, strength meter
   - On "Register" → trigger completion (success screen)
   - "Return to Course" → navigates to `/`

---

## Agent 3 — Evaluation & Polish

**Issues:** [PRA-7](https://linear.app/atomnik/issue/PRA-7)

**Context:**  
This is the final agent. All 4 registration steps are complete. This agent adds the scoring/evaluation layer and ensures the end-to-end flow is seamless.

**Tasks:**
1. **PRA-7: Implement Task Evaluation, Scoring & Completion Flow** (Medium)
   - Create `lib/evaluation.ts` — field-by-field comparison against ground truth
   - Scoring: exact match = 1, partial = 0.5, incorrect = 0
   - Display: accuracy %, field breakdown with ✅/❌, time taken
   - Update LMS sidebar to show task as "Completed"
   - Persist completion status via localStorage

---

## Execution Order

```
Agent 1 (PRA-3 + PRA-4)  →  Agent 2 (PRA-5 + PRA-6)  →  Agent 3 (PRA-7)
```

> **Reminder to all agents:** Read the PRD in Linear and follow `/coding-agent-workflow`. Mark issues as Done and write implementation comments when finished.
