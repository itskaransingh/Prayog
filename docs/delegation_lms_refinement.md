# Delegation Document - LMS Refinement: Question Panel & Evaluation Alignment

**Project**: Prayog Prototype: ITR Registration
**Milestone**: Milestone 2: Complete Registration Flow & Evaluation
**Agent**: 1 (Single agent)

## Context
Milestone 2 registration flow is complete. However, the LMS view (landing page) needs a clearer "Question" section that explicitly lists all the simulated person's details (PAN, Name, Address, Contact) so that students have a clear reference and the evaluation metrics (which are based on this data) make sense.

## Assigned Issue
- **PRA-8**: Add Question Details Panel and Align Evaluation Metrics

## Tasks
1. **LMS UI Refinement**:
   - In `components/lms/case-study-content.tsx`, add a new `Card` titled "Question: Registration Details" above the "Before You Begin" section.
   - Import `GROUND_TRUTH` from `@/lib/simulation/constants`.
   - Display all personal, address, and contact details from `GROUND_TRUTH` in a clear, structured (tabular or grid) format using shadcn UI components.
2. **Evaluation Alignment**:
   - Review `lib/evaluation.ts` and verify it scores against all fields displayed in the new Question panel.
   - If any discrepancies are found, update the evaluation logic or the displayed data to ensure 100% consistency.
3. **Success Screen Terminology**:
   - Ensure the evaluation results screen uses terminology consistent with the Question panel.

## Verification
- Run the app and verify the new section is cleanly integrated.
- Complete a registration with exact matching details and verify a 100% accuracy score.

## Note
- Use `shadcn` components for the LMS view.
- Maintain the premium, clean aesthetic of the existing LMS.
