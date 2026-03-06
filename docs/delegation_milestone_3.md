# Milestone 3 Delegation: Full UI Replication (Nergy Vidya)

This milestone focuses on achieving pixel-perfect replication of the Nergy Vidya (NV) user experience, from the initial dashboard to the final simulation success screen.

## Part 1: LMS & Case Study Flow

### PRA-15: Xavier's Homepage & Programs Layout
- **Target**: `app/(lms)/page.tsx`
- **Goal**: Replicate the "Our Programs" dashboard.
- **Details**:
    - Header: Nergy Vidya logo (top-left), Notification, Profile (top-right).
    - Xavier's Logo cards: "Semester 1 & 2 (Open Elective)", "Semester 2 (B.Com)".
    - "Nergy Offerings (New)" card.
    - Theme: Light grey background (#f3f4f6), clean shadow cards.

### PRA-16: Learning Contents & Assignment Wrapper
- **Target**: `app/(lms)/offerings/page.tsx` (New)
- **Goal**: Intermediate page after clicking "Nergy Offerings".
- **Details**:
    - Show two large cards: "Learning Contents" and "Assignment".
    - "Learning Contents" card MUST have a progress bar (e.g., 1.6%).
    - "Assignment" card MUST have a time progress (e.g., 0m/255h 40m).

### PRA-17: Learning Contents Grid (No Sidebar)
- **Target**: `app/(lms)/learning-contents/page.tsx`
- **Goal**: 3-column grid of courses.
- **Details**:
    - REMOVE left sidebar for this view.
    - Grid items: Income Tax, GST, Labour Laws, etc.
    - Each card: Title, Course Count, Progress Bar + Percentage.

### PRA-18: Income Tax Subtopics List
- **Target**: `app/(lms)/learning-contents/income-tax/page.tsx`
- **Goal**: Replicate the list of 18 subtopics.
- **Details**:
    - Single column list of wide cards.
    - Index circles (1, 2, 3...) in blue.
    - Subtopics: E-PAN, ITR-Registration, ITR Filing - AY 2025-2026, etc.

### PRA-19: Case Study Sidebar & simplified Content
- **Target**: `components/lms/case-study-content.tsx` & `components/lms/course-topics-sidebar.tsx`
- **Goal**: Navigator sidebar and simplified content.
- **Details**:
    - Left Sidebar: "Course Topics" with task IDs (ITREG_005AE Task).
    - Content: Single paragraph question at top.
    - Content: "Details for Registration" table below paragraph (PAN, Name, Status).

### PRA-20: Simulation Launcher (New Tab & States)
- **Target**: `components/lms/bottom-nav-bar.tsx`
- **Goal**: Update button behavior.
- **Details**:
    - Button states: "New Task" -> "Continue" -> "Re-Do Task".
    - Clicking button MUST `window.open` the simulation in a NEW TAB.

---

## Part 2: Simulation & Form Flow

### PRA-21: Simulation Gateway (Quick Links Wrapper)
- **Target**: `app/(simulation)/simulation/gateway/page.tsx`
- **Goal**: Full Portal 2.0 gateway replication.
- **Details**:
    - Left Sidebar: "Quick Links" with icons from `public/simulation/icons/`.
    - Items: e-Verify Return, Link Aadhaar, Link Aadhaar Status, e-Pay Tax, etc.
    - Top Navbar: Increase font size, add Question No, Call Us, Register button.

### PRA-26: Global State Management, Back Navigation & Auto-clear
- **Target**: `lib/simulation/registration-context.tsx` and related form wrappers.
- **Goal**: Improve session lifecycle and form navigation.
- **Details**:
    - Add a generic 'Back' button to all forms to go back to the previous step while preserving form progress.
    - Upon successful submission, if the user refreshes the page, completely wipe state immediately so they don't have to clear site data manually to start a new simulation.

### PRA-22: Form Refactoring (Basic/Contact Details & PAN Logic)
- **Target**: `components/simulation/registration-form.tsx` & `fill-details-form.tsx`
- **Goal**: Refactor the initial steps of the simulation.
- **Details**:
    - Registration Step 1: After PAN, add "Individual taxpayer" confirmation radio buttons with Note alerts. **User must be able to continue to Step 2 even if they select 'No'.**
    - Fill Details: Split into two visible modules/tabs - "Basic Details" and "Contact Details".
    - Use a custom Datepicker widget for Birthday.

### PRA-23: OTP UI (6-box inputs & Masking)
- **Target**: `components/simulation/otp-verification-form.tsx`
- **Goal**: Match exactly NV's OTP layout.
- **Details**:
    - Use 6 separate boxes for OTP inputs.
    - **CRITICAL**: The OTP inputs MUST be masked (show as `***` or `\u2022\u2022\u2022`) while typing.
    - Separate sections for Mobile OTP and Email OTP.
    - Form should omit the "Send OTP" button.

### PRA-24: Evaluation Popup on Verify Details
- **Target**: `components/simulation/verify-details-section.tsx`
- **Goal**: Real-time evaluation feedback loop.
- **Details**:
    - Replicate the final "Verify Details" layout.
    - **EVALUATION LOGIC**: Upon clicking 'Confirm', show a MODAL POPUP displaying fields filled incorrectly and the evaluation score.
    - The user can choose to go back and fix the issues or proceed.

### PRA-25: Password checklist & Success Screen
- **Target**: `components/simulation/password-creation-form.tsx` & Success Page
- **Goal**: Password validation aesthetics and final success view.
- **Details**:
    - Password checklist criteria (e.g., 8-14 chars, uppercase/lowercase, number, special char) must dynamically toggle (green ticks/red crosses) EXACTLY like the Nergy Vidya UI.
    - Set password should show Error or Success banner based on strength.
    - Personalized message note logic.
    - **Success page**: Upon final confirm, navigate to the successful page. Display user ID, Transaction ID, AND the final evaluation score.
