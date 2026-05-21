# Prayog LMS

Prayog is a learning management system for tax compliance education through hands-on simulation of government portals.

## Language

### Roles

**Super Admin**: A user with unrestricted access to all courses, user management, and system configuration.
_Avoid_: Root admin, system admin, owner

**Admin**: A user who can manage chapters and create faculty/student users within their assigned courses only.
_Avoid_: Moderator, content manager, editor

**Faculty**: A user who can create and edit tasks within their assigned courses.
_Avoid_: Teacher, instructor, content creator

**Student**: A user who can view and interact with enrolled courses and their content.
_Avoid_: User, learner, member

### Content Hierarchy

**Course**: A top-level learning subject (e.g., Financial Accounting, Income Tax, GST).
_Avoid_: Module, subject, program

**Chapter**: A unit of study within a Course (e.g., Ledger Classification within Financial Accounting).
_Avoid_: Submodule, lesson, topic

**Task**: A learning activity within a Chapter, combining a question description with its simulation configuration.
_Avoid_: Question, exercise, assignment

### Access

**Course Access**: The set of Courses a user (Admin, Faculty, or Student) is permitted to interact with.
_Avoid_: Enrollment, permission, assignment

## Relationships

- A **Course** contains one or more **Chapters**
- A **Chapter** contains one or more **Tasks**
- A **Super Admin** has implicit access to all **Courses**
- An **Admin** has explicit **Course Access** to a subset of Courses
- A **Faculty** has explicit **Course Access** to a subset of Courses
- A **Student** has explicit **Course Access** to a subset of Courses
- An **Admin** can only grant **Course Access** within their own assigned Courses
- Removing a Course from an Admin's access cascades to remove it from all Faculty and Students they granted access to

## Example dialogue

> **Dev:** "When a **Super Admin** creates an **Admin**, do they assign **Course Access** at creation?"
> **Domain expert:** "Yes — an **Admin** is created with access to specific **Courses**. They can only manage **Chapters** and create **Faculty**/**Students** within those **Courses**."

> **Dev:** "Can a **Faculty** member edit a **Task** created by another **Faculty** in the same **Chapter**?"
> **Domain expert:** "Yes — **Tasks** belong to the **Chapter**, not to individual **Faculty**. Any **Faculty** with access to that **Chapter** can edit any **Task** in it."

> **Dev:** "If a **Super Admin** removes **Course Access** from an **Admin**, what happens to the **Faculty** and **Students** that **Admin** created for that **Course**?"
> **Domain expert:** "They lose access too — the revocation cascades down."

## Flagged ambiguities

- "Module" was renamed to **Course** — the old term referred to top-level content categories like "Income Tax" and "GST"
- "Submodule" was renamed to **Chapter** — the old term referred to units within a Module
- "Question" and "Simulation Task" are now unified under **Task** — they remain separate in the database but are treated as one unit in the UI
- "Admin" now refers to the middle-tier role; the former "Admin" is now **Super Admin**
- "User" role is now **Student**
