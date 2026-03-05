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

### PRA-22: Form Refactoring & Identity Check
- **Target**: `components/simulation/registration-form.tsx` & `fill-details-form.tsx`
- **Details**:
    - Registration Step 1: After PAN, add "Individual taxpayer" confirmation radio buttons with Note alerts.
    - Fill Details: Split into two modules - "Basic Details" and "Contact Details".
    - Use a Datepicker widget for Birthday.

### PRA-23: OTP UI & Validation
- **Target**: `components/simulation/otp-verification-form.tsx`
- **Details**:
    - Use 6 separate boxes for OTP inputs.
    - Separate sections for Mobile OTP and Email OTP.
    - Remove "Send OTP" button.

### PRA-24: Evaluation Popup & Verify Details
- **Target**: `components/simulation/verify-details-section.tsx`
- **Details**:
    - Replicate the final "Verify Details" layout.
    - TRIGGER EVALUATION HERE: Show the score and correct/incorrect fields in a MODAL POPUP on this page.

### PRA-25: Password checklist & Success Screen
- **Target**: `components/simulation/password-creation-form.tsx` & Success Page
- **Details**:
    - Checklist items should "check off" (green) as user types.
    - Personalized message note logic.
    - Success page: Show Transaction ID and background decorations.
