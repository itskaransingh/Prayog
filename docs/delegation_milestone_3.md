# Milestone 3 Delegation: ITR-1 Filing Simulation & Dashboard

## Overview
This milestone transitions from the administrative Registration flow to the core filing experience. Students will use their registered credentials to log in, view their dashboard, and start the ITR-1 filing process.

## Workforce: 3 Coding Agents (Sequential)

---

### Agent 1: Portal Dashboard & Login Simulation
**Issue ID:** `PRA-9`
**Task:** Build the post-login dashboard and the initial "File Return" entry point.
- Implement a simplified "Dashboard" view showing "Returns Filed", "Actionable Items", and a "File Now" button.
- Create a mock Login screen that accepts the credentials created in Milestone 2 (saved in context/localStorage).
- **Goal:** Ensure a seamless transition from registration to the main portal area.

---

### Agent 2: ITR-1 Multi-Tab Form (Part A - General Info & Salary)
**Issue ID:** `PRA-10`
**Task:** Build the first two tabs of the ITR-1 filing form.
- **Tab 1: Personal Information** (Pre-filled from Registration context).
- **Tab 2: Gross Total Income** (Salary, House Property, Other Sources).
- Implement client-side calculations for "Gross Total Income".
- Use the Vanilla CSS simulation style to match the government portal's multi-tab layout.

---

### Agent 3: ITR-1 Filing (Part B - Tax Computation & Submission)
**Issue ID:** `PRA-11`
**Task:** Build the final tabs and the submission/verification flow.
- **Tab 3: Total Deductions** (80C, 80D, etc.).
- **Tab 4: Tax Paid & Computation**.
- Logic to calculate tax liability based on the "Old vs New" regime (simplified).
- Final "Submit" screen with a success message and a downloadable (mock) PDF receipt.

---

## Technical Standards
- **Style:** Vanilla CSS for all simulation forms.
- **State:** Use the existing `RegistrationProvider` or a new `FilingProvider` for multi-tab persistence.
- **Evaluation:** Each tab should have underlying `GROUND_TRUTH` fields for later evaluation (to be implemented in Milestone 4).
