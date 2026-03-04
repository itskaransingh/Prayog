# Precise Delegation: UI Fixes & Gateway Refinement

## PRA-13: Gateway Layout Fix (Precise)
**Hallucination Source:** `.sim-hero-overlay` in `simulation.css` uses rigid positioning that clashes with different viewport sizes and banner content.
**Action Plan:**
*   Remove absolute positioning from `.sim-hero-overlay` or refine it with percentage-based safety margins.
*   Ensure text labels "e-Filing Anywhere..." and "Experience portal 2.0" have clear `z-index` and background-shadow treatments if needed, but primarily correct the grid/flex alignment.
*   The "Register" button MUST route to `/simulation`.

## PRA-14: LMS Footer Bug
**Bug:** `BottomNavBar` is visible everywhere in `(lms)` layout.
**Action Plan:**
*   Edit `app/(lms)/layout.tsx`.
*   Import `usePathname` from `next/navigation`.
*   Wrap `<BottomNavBar />` in a condition: `pathname.startsWith('/course')`.

## PRA-12: Routing Logic
**Action Plan:**
*   Update `components/lms/dashboard-grid.tsx` or the sidebar logic.
*   Navigation Path: Dashboard -> Case Study -> Start Task -> **/simulation/gateway** -> Register -> **/simulation**.
