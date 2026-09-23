# EpiWork — Proof of Concept Design

**Date:** 2026-09-23
**Status:** Draft for review

## 1. Goal

EpiWork is a platform for running technical workshops at Epitech. An **admin**
(workshop coach/facilitator) authors workshops as an ordered sequence of steps.
A **student** works through a workshop's steps in order. Some steps are
**checkpoints**: the student must submit an answer and wait for the admin to
review and unlock the next step before continuing. Students can also flag
"I need help" on any step at any time, independent of checkpoints.

The admin's core need is live visibility during a session: who is stuck, who
is waiting on a review, and where the class as a whole is bunching up.

This is a proof of concept: a minimal but functional end-to-end slice, not a
production-hardened system. Auth is intentionally fake (no passwords) so the
POC can focus on the workshop/checkpoint/monitoring mechanics.

## 2. Scope

**In scope for this POC:**
- Fake login: pick "Admin" or pick a student from a seeded list
- Admin: create/edit/remove workshops and their steps; mark a step as a
  checkpoint; attach an optional question (free text, multiple choice, or
  simple confirmation) to a step
- Student: view assigned workshops, walk through steps in order, submit
  checkpoint answers, hit "I need help" on any step
- Admin: home dashboard across all workshops (progress rail + priority feed),
  drill into a single workshop to review checkpoint submissions and unlock
  them, clear help flags
- SQLite persistence via Prisma; a small number of backend unit tests for the
  progress/locking state machine

**Explicitly out of scope for this POC:**
- Real authentication/authorization, password hashing, sessions/JWT
- Multi-class/cohort management, student self-registration
- Notifications (email/push) — the admin dashboard is the only place signals
  surface
- Auto-grading of multiple-choice/text answers — admin always makes the
  unlock decision manually
- Rich text/markdown authoring, file uploads, code execution sandboxes

## 3. Architecture

Two separate apps, communicating over a REST API:

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite, accessed via Prisma (schema/migrations)

No session/token infrastructure: the frontend stores the selected user's id
(from fake login) in `localStorage` and sends it as a header
(`x-user-id`) on every API request. The backend trusts this header to
identify the caller and look up their role — acceptable for a POC, not for
production.

## 4. Data model

```
User
  id            Int      @id @default(autoincrement())
  name          String
  role          String   // "admin" | "student"

Workshop
  id            Int      @id @default(autoincrement())
  title         String
  description   String

Step
  id            Int      @id @default(autoincrement())
  workshopId    Int
  order         Int
  title         String
  content       String   // the "subject" / instructions shown to the student
  isCheckpoint  Boolean  @default(false)
  questionType  String?  // "text" | "multiple_choice" | "confirm" | null
  questionPrompt String?
  questionOptions String? // JSON-encoded array, only for multiple_choice

StepProgress
  id              Int      @id @default(autoincrement())
  studentId       Int
  stepId          Int
  status          String   // "locked" | "available" | "pending_review" | "unlocked" | "done"
  submittedAnswer String?
  helpRequested   Boolean  @default(false)
  updatedAt       DateTime @updatedAt
```

**Status semantics for a `StepProgress` row:**
- `locked` — a previous step isn't done yet; student can't act on this step
- `available` — student can view/act on this step (previous step is done)
- `pending_review` — student submitted an answer on a checkpoint step;
  blocked until admin reviews
- `unlocked` — admin reviewed and approved; student may proceed to the next
  step (functionally equivalent to `done` for non-checkpoint steps, kept
  distinct so the UI can show "just unlocked" state briefly)
- `done` — step fully completed, student has moved past it

`helpRequested` is independent of `status` — a student can flag help while
`available`, `pending_review`, or otherwise.

A `StepProgress` row is created lazily (first step `available`, rest
`locked`) when a student first opens a workshop.

## 5. Auth (fake)

Login screen shows two choices: "I'm the Admin" or a list of seeded student
names. Selecting one stores `{ id, role }` in `localStorage`. No password,
no server-side session. All API calls include `x-user-id`; the backend
resolves it to a `User` row and role-checks from there (e.g., only `admin`
may create workshops or unlock checkpoints).

## 6. Core flows

**Admin authoring:**
Create a workshop (title, description) → add steps in order (title, content,
optionally mark as checkpoint and attach a question of one of the three
types) → reorder/edit/remove steps → publish (workshops are visible to
students as soon as created, no separate draft state needed for the POC).

**Student progression:**
Open an assigned workshop → see step 1 as `available`, later steps `locked`
→ read the subject, optionally submit an answer if it's a checkpoint → if
checkpoint: status becomes `pending_review`, student waits → once admin
unlocks, next step becomes `available` → repeat until last step is `done`.
Non-checkpoint steps complete immediately on "mark done" / "next", no admin
involvement.

**Help requests:**
A "I need help" button is present on every step page regardless of
checkpoint state. Clicking it sets `helpRequested = true` on that student's
current `StepProgress` row and surfaces it on the admin dashboard. The admin
manually clears it (e.g., "resolve" button) after helping the student, which
sets it back to `false`.

**Admin review:**
From the admin's per-workshop view, pending checkpoint submissions are
listed with the student's answer visible. Admin can unlock (advance the
student) or leave it (e.g., to talk to the student first). There's no
reject/feedback-text flow in the POC — unlock is a one-way action.

## 7. UI design

**Visual design system** (derived from the technical/operations nature of
the tool — Epitech students and coaches are a technical audience, and the
core admin need is live monitoring, not marketing):

- Primary: `#1E40AF` (blue) — primary actions, active/in-progress state
- Accent: `#D97706` (amber) — "needs help" signal, warnings
- Foreground text: `#1E3A8A` on light backgrounds
- Background: `#F8FAFC`, muted surfaces `#E9EEF6`, borders `#DBEAFE`
- Destructive: `#DC2626` (remove workshop/step, reject actions)
- "Awaiting review" signal color: a distinct blue-secondary `#3B82F6`
  (kept separate from primary blue and from the amber "needs help" color so
  the two admin-attention states are never confused)
- "Done" signal color: green `#4C8065` (used consistently in dashboard rails
  and feed)
- Typography: **Fira Sans** for UI text (labels, body, headings), **Fira
  Code** for tabular/data labels (step numbers, counts, timestamps) — ties
  visually to a coding-school audience without becoming a themed gimmick
- No emoji icons; use a consistent SVG icon set (e.g. Lucide) throughout
- Standard accessibility floor: 4.5:1 text contrast, visible focus rings,
  44px minimum touch targets, `prefers-reduced-motion` respected

**Step page (student view)** — validated via mockup:
Split-column layout on tablet/desktop: subject/instructions on the left
(scrolls independently), question/answer + "Submit answer" + "I need help"
on the right, always in view alongside the instructions. Collapses to a
single stacked column (subject above, question below) on narrow/mobile
screens, since the two-column layout only makes sense with enough
horizontal space.

**Admin home (across all workshops)** — validated via mockup:
Top section is a **progress rail**: one horizontal line per active
workshop, with every enrolled student rendered as a colored dot positioned
at their current step (green = done, blue-secondary = awaiting review,
amber = needs help, grey = in progress). This makes clusters/stragglers in
the class visible at a glance across every workshop simultaneously.
Below it, a **priority feed**: a time-ordered list of attention-worthy
events ("Bilal needs help — Networking Basics, step 2 — 3 min ago"),
combining help flags and pending reviews from every workshop into one feed,
most recent first. Clicking a workshop in the rail (or an item in the feed)
drills into that workshop's detail view (step list, per-student status,
checkpoint review UI described in §6).

## 8. API surface (indicative)

```
POST   /login                          { userId }              (fake login)
GET    /workshops                                                (list)
POST   /workshops                      { title, description }    (admin)
PATCH  /workshops/:id                                             (admin)
DELETE /workshops/:id                                             (admin)
POST   /workshops/:id/steps            { ...step fields }         (admin)
PATCH  /steps/:id                                                  (admin)
DELETE /steps/:id                                                  (admin)
GET    /workshops/:id/progress                                    (admin — per-student status)
GET    /me/workshops/:id                                          (student — steps + my progress)
POST   /steps/:id/submit               { answer }                 (student — checkpoint submit)
POST   /steps/:id/help                                             (student — toggle help flag)
POST   /steps/:id/unlock               { studentId }               (admin)
POST   /steps/:id/resolve-help         { studentId }               (admin)
GET    /admin/feed                                                  (admin — cross-workshop priority feed)
```

## 9. Testing approach

Given POC scope, prioritize manual click-through testing of the full loop:
admin creates a workshop with a checkpoint step → student progresses,
submits at the checkpoint, hits help → admin sees both signals on the
dashboard, unlocks the checkpoint and resolves the help flag → student
continues to completion. Add backend unit tests for the `StepProgress`
state-transition logic (the locked → available → pending_review → unlocked
→ done chain, including the checkpoint-vs-non-checkpoint branch), since
that's the logic most likely to have subtle off-by-one or race bugs. No
end-to-end/browser automation for this POC.

## 10. Open questions / future work (not blocking this POC)

- What happens to `StepProgress` if an admin edits/removes a step a student
  has already progressed past? (Not handled in the POC — assume workshops
  aren't edited mid-session.)
- Real auth, multi-cohort support, and notifications are deferred until
  after the POC validates the core mechanic.
