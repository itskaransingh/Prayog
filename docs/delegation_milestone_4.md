# Milestone 4.1 Delegation: Supabase Auth & Admin Dashboard

**Important Directive for all Agents**: You MUST refer to the existing `@[.agents/workflows/coding-agent-workflow.md]` file before beginning execution. Follow all its guidelines for tracking work in Linear.

---

## Agent 1: Auth Foundation (PRA-32)
**Goal**: Set up the environment, Supabase clients, database table, and middleware protection.

### PRA-32: Supabase Architecture & Middleware
**Reference Workflow**: `@[.agents/workflows/coding-agent-workflow.md]`

- **Database Setup**:
  - Since this agent only writes code, the user must ensure the custom `profiles` table exists in Supabase: `id` (uuid, primary key, refs `auth.users.id`), `email` (text), `role` (text: `"admin"` or `"user"`), `created_at` (timestamp default now()). Note: *No `created_by` column*.
- **Client Setup**:
  - Install `@supabase/ssr` if not present.
  - Create `lib/supabase/client.ts` → browser client using `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Create `lib/supabase/server.ts` → server-side client with cookie handling.
  - Create `lib/supabase/admin.ts` → admin client using `SUPABASE_SERVICE_ROLE_KEY`. *Must only be used on the server.*
- **Middleware Integration**:
  - Create `middleware.ts` in the project root.
  - **Rules**:
    - Unauthenticated users → redirect to `/login`.
    - Authenticated users hitting `/login` → redirect to `/`.
    - Authenticated users hitting `/dashboard` where `role !== 'admin'` → redirect to `/`.
  - The middleware needs to decode the user's profile role (likely requiring a fast lookup to the `profiles` table or embedding the role in the JWT metadata).

---

## Agent 2: Login Component & Navbar (PRA-33)
**Goal**: Build a modern login experience and the role-aware global navbar.

### PRA-33: Login UI & Role-Aware Navigation
**Reference Workflow**: `@[.agents/workflows/coding-agent-workflow.md]`

- **Login UI (`app/login/page.tsx`)**:
  - Refactor to a visually appealing, modern Tailwind UI card (centered, good spacing, smooth focus states).
  - Handle sign-in via `client.ts`.
  - **Redirect Logic**: If `role === 'admin' || role === 'user'`, redirect the user to `/`. (Admins have access to `/dashboard` but login lands them on `/`).
- **Global Navbar**:
  - Update the Top Navbar (either in `layout.tsx` or a dedicated Header component).
  - Layout: App name on left. "Logout" button on right.
  - **Role-Awareness**: If `role === 'admin'`, display a "Dashboard" button that navigates to `/dashboard`. Normal users should NOT see this button.

---

## Agent 3: Admin Dashboard (PRA-34)
**Goal**: Build the modular admin dashboard and the secure User Creation API.

### PRA-34: Modular Dashboard & Secure User Creation
**Reference Workflow**: `@[.agents/workflows/coding-agent-workflow.md]`

- **API Routes**:
  - `app/api/admin/create-user/route.ts`:
    - 1. Verify requester is authenticated with `role === 'admin'`.
    - 2. Use `lib/supabase/admin.ts` to call `supabase.auth.admin.createUser()`.
    - 3. Insert the newly created user's `id`, `email`, and `role` into the `profiles` table.
  - `app/api/admin/users/route.ts` (Optional/Recommended): Create an endpoint to securely fetch the full list of profiles for the dashboard.
- **Admin Dashboard UI (`app/dashboard/page.tsx`)**:
  - Create a clean layout with sections (e.g., Overview, Users, Settings).
  - **Crucial**: Display a data table or list showing ALL active users currently in the database (fetched securely).
  - Build the "Create User" form (Email, Password, Role).
  - The form submits payload to the new API route and updates the user list upon success.
