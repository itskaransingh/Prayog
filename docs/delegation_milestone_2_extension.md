# Delegation Plan: Milestone 2 Post-Pitch UI Enhancements

## Context
Following the pitch to Xavier's College, the board requested UI refinements to closer match the Nergy Vidya experience and the real-world Income Tax Portal.

This extension to Milestone 2 involves two major frontend tasks:
1.  **LMS Dashboard Revamp**: Updating our course selection screen to mirror Nergy Vidya's "Learning Contents" grid.
2.  **Simulation Gateway**: Adding an authentic-looking landing page for the Income Tax simulation that mimics the real government portal, acting as the entry point before the registration form starts.

## Linear Issues Delegated

### Issue 1: [PRA-12] LMS Dashboard UI Revamp (Nergy Vidya Style)
**Goal:** Redesign the main LMS/Dashboard view to feature a grid of course topics with progress indicators.
**Key Requirements:**
*   Create a responsive grid layout of cards for various tax topics (e.g., "Income Tax", "Goods and Service Tax", "Labour Laws").
*   Each card should display a dummy progress bar (e.g., 38%) and a sub-text for "X Courses" or "X Tasks".
*   Incorporate the "Income Tax" card as the primary interactive element that routes the user to the ITR-Registration task list/viewer.
**Technical Approach:**
*   Modify `app/page.tsx` or the relevant dashboard layout component.
*   Use Shadcn UI `Card` and `Progress` components to build the grid items.

### Issue 2: [PRA-13] ITR Simulation Gateway (Income Tax Portal Clone)
**Goal:** Create a landing page that perfectly clones the pre-login interface of the Indian Income Tax portal.
**Key Requirements:**
*   Build a high-fidelity replica of the IT portal gateway. Key elements include:
    *   Top sub-header (Call Us, Font size, Login, Register).
    *   Main Blue Navigation Bar (Home, Individual/HUF, Company, etc.).
    *   Left Sidebar for "Quick Links".
    *   Central Hero section with official-looking banners.
*   The **Register** button in the top right corner MUST be the active trigger that starts our existing multi-step registration flow.
**Technical Approach:**
*   Create a new route/component (e.g., `app/(simulation)/simulation/gateway/page.tsx` or handle it as `currentStep === 'gateway'` in `page.tsx`).
*   Strictly use Vanilla CSS (`simulation.css`) for this page to maintain the simulation stylistic boundary. No Tailwind.

## For the Following Agent
1.  Read the target Linear issue (PRA-12 or PRA-13).
2.  Acknowledge that PRA-13 must use **Vanilla CSS only**.
3.  Once the UI is verified, update the task checklist and Linear.
