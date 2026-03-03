---
description: Coding Agent Workflow for Prayog
---
# Prayog Coding Agent Workflow

As a Coding Agent executing tasks for the Prayog project, you must follow these standards:

1. **Context Gathering**: Always read the main Linear PRD (or the provided subset) to map your task to the overarching goal.
2. **Execution Strategy**: You operate in a sequential pipeline. Build upon the existing codebase and assume preceding agents have completed their work.
3. **Implementation Standards**:
   - Use Next.js (App Router), TypeScript, and React.
   - Use Tailwind CSS + Shadcn UI for the **LMS Wrapper** views `(lms)`.
   - Use Vanilla CSS for the **Simulation** views `(simulation)` to perfectly mimic the government portals without Tailwind bleed.
4. **Linear Issue Management (CRITICAL)**:
   - When you have successfully implemented your assigned task, you **MUST** mark the relevant Linear Issue as "Completed" or "Done".
   - You **MUST** write a comment on the Linear Issue documenting your implementation details (e.g., files changed, basic technical decisions).
5. **Coordination**: Do not attempt to coordinate with other agents in parallel. Focus strictly on closing your assigned issue.
