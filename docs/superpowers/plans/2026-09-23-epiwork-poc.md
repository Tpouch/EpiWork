# EpiWork POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working end-to-end POC of EpiWork — admins author workshops made of ordered steps (some checkpoints requiring review), students progress through them, and admins get a live cross-workshop dashboard (progress rail + priority feed) styled after Epitech's own student portal.

**Architecture:** Two separate apps talking over REST. Backend: Node/Express + Prisma + SQLite, with the checkpoint/lock/help logic isolated in a pure state-machine module so it can be unit-tested against a real (test) database without going through HTTP. Frontend: React + Vite + Mantine (dark theme matching my.epitech.eu), no session/token — the selected fake-login user's id travels as an `x-user-id` header.

**Tech Stack:** Node.js, Express, Prisma (SQLite), Jest; React, Vite, Mantine v7, react-router-dom.

**Spec:** `docs/superpowers/specs/2026-09-23-epiwork-poc-design.md`

## Global Constraints

- No real auth: no passwords, no sessions/JWT — `x-user-id` header only (spec §5).
- SQLite via Prisma is the only persistence (spec §3).
- Admin-only actions (workshop/step CRUD, unlock, resolve-help) must reject non-admins (spec §5, §6).
- `helpRequested` is independent of `status` and is never implicitly cleared by a status transition — only an explicit resolve/toggle clears it (spec §4, §6).
- Unlocking the last step in a workshop must not create a phantom next-step row (implied by spec §4's "if next step exists" logic).
- No emoji icons; Anton for hero/page titles, Space Mono for tags/labels, IBM Plex Sans for everything else; colors from spec §7 (`#181818` bg, `#809DFD` primary, `#FF5F3A` needs-help, `#00FF97` done, `#29D9FF` awaiting-review, `#FF1EF7` section bars) (spec §7).
- No end-to-end/browser automation for this POC; automated tests are backend-only (spec §9).

## Review Focus

- Submitting an answer to a step that is `locked` or already `done`/`pending_review` must be rejected, not silently accepted — covered in Task 3.
- Unlocking a step that is not currently `pending_review` (e.g. calling unlock twice, or on a non-checkpoint step) must be rejected — covered in Task 3.
- Unlocking the last step of a workshop must not create a phantom `StepProgress` row for a step that doesn't exist — covered in Task 3.
- A student calling an admin-only route (unlock, resolve-help, workshop/step create/edit/delete) must get rejected (403) rather than mutating data — covered in Task 4.
- `helpRequested` must survive a status transition (e.g. flag help on a checkpoint, then have the admin unlock it) — the flag must still be `true` until explicitly resolved — covered in Task 3.

---

## Task 1: Backend & frontend scaffolding

**Files:**
- Create: `backend/package.json`
- Create: `backend/.gitignore`
- Create: `frontend/package.json` (via `npm create vite`)
- Create: `.gitignore` (repo root, already exists — extend it)

**Interfaces:**
- Produces: `backend/` runnable with `npm run dev` (once later tasks add `src/index.js`); `frontend/` runnable with `npm run dev`.

- [ ] **Step 1: Scaffold the backend**

```bash
cd /Users/pandorian/Delivery/EpiWork
mkdir -p backend/src/routes backend/src/middleware backend/src/progress backend/prisma
cd backend
npm init -y
npm install express cors @prisma/client
npm install -D prisma jest
```

- [ ] **Step 2: Set backend package.json scripts**

Edit `backend/package.json` so the `scripts` block reads:

```json
{
  "scripts": {
    "dev": "node src/index.js",
    "seed": "node prisma/seed.js",
    "test": "DATABASE_URL=file:./prisma/test.db npx prisma migrate deploy && DATABASE_URL=file:./prisma/test.db npx jest --runInBand"
  }
}
```

- [ ] **Step 3: Add a backend .gitignore**

Create `backend/.gitignore`:

```
node_modules/
prisma/dev.db
prisma/test.db
.env
```

- [ ] **Step 4: Scaffold the frontend with Vite + React**

```bash
cd /Users/pandorian/Delivery/EpiWork
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install @mantine/core @mantine/hooks react-router-dom
```

- [ ] **Step 5: Add a frontend .gitignore entry**

Confirm `frontend/.gitignore` (created by the Vite template) already ignores `node_modules/` and `dist/`. If not, add both lines.

- [ ] **Step 6: Commit scaffolding**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add backend/package.json backend/.gitignore frontend
git commit -m "chore: scaffold backend (Express/Prisma) and frontend (Vite/React/Mantine)"
```

---

## Task 2: Prisma schema, migration, and seed data

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/.env`
- Create: `backend/prisma/seed.js`

**Interfaces:**
- Produces: `User`, `Workshop`, `Step`, `StepProgress` Prisma models, matching spec §4, with proper relations. Later tasks import `require('@prisma/client')` and the shared client from `backend/src/db.js` (created in Task 4).

- [ ] **Step 1: Write the Prisma schema**

Create `backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           Int            @id @default(autoincrement())
  name         String
  role         String
  stepProgress StepProgress[]
}

model Workshop {
  id          Int    @id @default(autoincrement())
  title       String
  description String
  steps       Step[]
}

model Step {
  id              Int            @id @default(autoincrement())
  workshopId      Int
  workshop        Workshop       @relation(fields: [workshopId], references: [id])
  order           Int
  title           String
  content         String
  isCheckpoint    Boolean        @default(false)
  questionType    String?
  questionPrompt  String?
  questionOptions String?
  progress        StepProgress[]
}

model StepProgress {
  id              Int      @id @default(autoincrement())
  studentId       Int
  student         User     @relation(fields: [studentId], references: [id])
  stepId          Int
  step            Step     @relation(fields: [stepId], references: [id])
  status          String   @default("locked")
  submittedAnswer String?
  helpRequested   Boolean  @default(false)
  updatedAt       DateTime @updatedAt

  @@unique([studentId, stepId])
}
```

- [ ] **Step 2: Create the .env and run the first migration**

Create `backend/.env`:

```
DATABASE_URL="file:./prisma/dev.db"
```

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
npx prisma migrate dev --name init
```

Expected: creates `backend/prisma/dev.db`, prints "Your database is now in sync with your schema."

- [ ] **Step 3: Write the seed script**

Create `backend/prisma/seed.js`:

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({ data: { name: 'Admin', role: 'admin' } });
  const alice = await prisma.user.create({ data: { name: 'Alice', role: 'student' } });
  const bilal = await prisma.user.create({ data: { name: 'Bilal', role: 'student' } });
  await prisma.user.create({ data: { name: 'Chloé', role: 'student' } });

  const workshop = await prisma.workshop.create({
    data: {
      title: 'Networking Basics',
      description: 'Intro to subnets, routing, and basic diagnostics.',
      steps: {
        create: [
          {
            order: 1,
            title: 'Set up your VM',
            content: 'Boot the provided VM and confirm you can SSH into it.',
            isCheckpoint: false,
          },
          {
            order: 2,
            title: 'Configure a static IP',
            content: 'Assign a static IP to the VM.',
            isCheckpoint: true,
            questionType: 'text',
            questionPrompt: 'Which subnet did you use and why?',
          },
          {
            order: 3,
            title: 'Trace a route',
            content: 'Run traceroute to 8.8.8.8 and note the hop count.',
            isCheckpoint: false,
          },
        ],
      },
    },
  });

  console.log('Seeded workshop', workshop.id, 'with students', alice.id, bilal.id);
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 4: Run the seed and verify**

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
npm run seed
```

Expected: prints `Seeded workshop 1 with students 2 3` (ids may vary).

- [ ] **Step 5: Commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add backend/prisma backend/.gitignore
git commit -m "feat: add Prisma schema, migration, and seed data"
```

Note: `backend/.env` is gitignored (it's in the .gitignore from Task 1) — that's intentional, it's local config.

---

## Task 3: Progress state-machine module (TDD)

**Files:**
- Create: `backend/src/progress/stateMachine.js`
- Create: `backend/src/progress/stateMachine.test.js`

**Interfaces:**
- Produces: `ensureProgress(prisma, workshopId, studentId)`, `submitAnswer(prisma, stepId, studentId, answer)`, `unlockStep(prisma, stepId, studentId)`, `toggleHelp(prisma, stepId, studentId, helpRequested)` — all async, all take a Prisma client as first arg. Later tasks (Task 7) import these directly.
- Consumes: the Prisma models from Task 2.

- [ ] **Step 1: Write the failing tests**

Create `backend/src/progress/stateMachine.test.js`:

```js
const { PrismaClient } = require('@prisma/client');
const { ensureProgress, submitAnswer, unlockStep, toggleHelp } = require('./stateMachine');

const prisma = new PrismaClient();

async function resetDb() {
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

describe('progress state machine', () => {
  let workshop, student, stepA, stepB, stepC;

  beforeEach(async () => {
    await resetDb();
    student = await prisma.user.create({ data: { name: 'Alice', role: 'student' } });
    workshop = await prisma.workshop.create({ data: { title: 'Networking', description: 'desc' } });
    stepA = await prisma.step.create({
      data: { workshopId: workshop.id, order: 1, title: 'Step A', content: 'do A', isCheckpoint: false },
    });
    stepB = await prisma.step.create({
      data: {
        workshopId: workshop.id,
        order: 2,
        title: 'Step B',
        content: 'do B',
        isCheckpoint: true,
        questionType: 'text',
        questionPrompt: 'Explain B',
      },
    });
    stepC = await prisma.step.create({
      data: { workshopId: workshop.id, order: 3, title: 'Step C', content: 'do C', isCheckpoint: false },
    });
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  test('ensureProgress creates first step available, rest locked', async () => {
    const rows = await ensureProgress(prisma, workshop.id, student.id);
    expect(rows.map((r) => r.status)).toEqual(['available', 'locked', 'locked']);
  });

  test('submitAnswer on non-checkpoint step marks it done and unlocks next', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, null);
    const rows = await prisma.stepProgress.findMany({ where: { studentId: student.id } });
    const byStep = Object.fromEntries(rows.map((r) => [r.stepId, r.status]));
    expect(byStep[stepA.id]).toBe('done');
    expect(byStep[stepB.id]).toBe('available');
  });

  test('submitAnswer on checkpoint step sets pending_review and does not unlock next', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, null);
    await submitAnswer(prisma, stepB.id, student.id, 'my answer');
    const rows = await prisma.stepProgress.findMany({ where: { studentId: student.id } });
    const byStep = Object.fromEntries(rows.map((r) => [r.stepId, r]));
    expect(byStep[stepB.id].status).toBe('pending_review');
    expect(byStep[stepB.id].submittedAnswer).toBe('my answer');
    expect(byStep[stepC.id].status).toBe('locked');
  });

  test('submitAnswer throws if step is not available (e.g. still locked)', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await expect(submitAnswer(prisma, stepB.id, student.id, 'too early')).rejects.toThrow();
  });

  test('unlockStep moves pending_review to done and unlocks next step', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, null);
    await submitAnswer(prisma, stepB.id, student.id, 'answer');
    await unlockStep(prisma, stepB.id, student.id);
    const rows = await prisma.stepProgress.findMany({ where: { studentId: student.id } });
    const byStep = Object.fromEntries(rows.map((r) => [r.stepId, r.status]));
    expect(byStep[stepB.id]).toBe('done');
    expect(byStep[stepC.id]).toBe('available');
  });

  test('unlockStep throws if step is not pending_review', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await expect(unlockStep(prisma, stepA.id, student.id)).rejects.toThrow();
  });

  test('unlocking the last step does not create a phantom next-step row', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, null);
    await submitAnswer(prisma, stepB.id, student.id, 'answer');
    await unlockStep(prisma, stepB.id, student.id);
    await submitAnswer(prisma, stepC.id, student.id, null);
    const rows = await prisma.stepProgress.findMany({ where: { studentId: student.id } });
    expect(rows).toHaveLength(3);
  });

  test('toggleHelp sets and clears helpRequested independent of status', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await toggleHelp(prisma, stepA.id, student.id, true);
    let row = await prisma.stepProgress.findFirst({ where: { stepId: stepA.id, studentId: student.id } });
    expect(row.helpRequested).toBe(true);
    expect(row.status).toBe('available');
    await toggleHelp(prisma, stepA.id, student.id, false);
    row = await prisma.stepProgress.findFirst({ where: { stepId: stepA.id, studentId: student.id } });
    expect(row.helpRequested).toBe(false);
  });

  test('helpRequested survives unlockStep — only an explicit toggle clears it', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, null);
    await submitAnswer(prisma, stepB.id, student.id, 'answer');
    await toggleHelp(prisma, stepB.id, student.id, true);
    await unlockStep(prisma, stepB.id, student.id);
    const row = await prisma.stepProgress.findFirst({ where: { stepId: stepB.id, studentId: student.id } });
    expect(row.status).toBe('done');
    expect(row.helpRequested).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
DATABASE_URL=file:./prisma/test.db npx prisma migrate deploy
DATABASE_URL=file:./prisma/test.db npx jest --runInBand
```

Expected: FAIL with `Cannot find module './stateMachine'` (or similar — the module doesn't exist yet).

- [ ] **Step 3: Implement the state machine**

Create `backend/src/progress/stateMachine.js`:

```js
async function ensureProgress(prisma, workshopId, studentId) {
  const steps = await prisma.step.findMany({ where: { workshopId }, orderBy: { order: 'asc' } });
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const existing = await prisma.stepProgress.findFirst({ where: { stepId: step.id, studentId } });
    if (!existing) {
      await prisma.stepProgress.create({
        data: { stepId: step.id, studentId, status: i === 0 ? 'available' : 'locked' },
      });
    }
  }
  return prisma.stepProgress.findMany({
    where: { studentId, step: { workshopId } },
    include: { step: true },
    orderBy: { step: { order: 'asc' } },
  });
}

async function completeStep(prisma, progressId, step) {
  await prisma.stepProgress.update({ where: { id: progressId }, data: { status: 'done' } });
  const nextStep = await prisma.step.findFirst({
    where: { workshopId: step.workshopId, order: step.order + 1 },
  });
  if (nextStep) {
    const progress = await prisma.stepProgress.findFirst({ where: { id: progressId } });
    const nextProgress = await prisma.stepProgress.findFirst({
      where: { stepId: nextStep.id, studentId: progress.studentId },
    });
    if (nextProgress) {
      await prisma.stepProgress.update({ where: { id: nextProgress.id }, data: { status: 'available' } });
    } else {
      await prisma.stepProgress.create({
        data: { stepId: nextStep.id, studentId: progress.studentId, status: 'available' },
      });
    }
  }
  return prisma.stepProgress.findUnique({ where: { id: progressId } });
}

async function submitAnswer(prisma, stepId, studentId, answer) {
  const progress = await prisma.stepProgress.findFirst({ where: { stepId, studentId } });
  const step = await prisma.step.findUnique({ where: { id: stepId } });
  if (!progress || progress.status !== 'available') {
    throw new Error('Step is not available for this student');
  }
  if (step.isCheckpoint) {
    return prisma.stepProgress.update({
      where: { id: progress.id },
      data: { status: 'pending_review', submittedAnswer: answer },
    });
  }
  return completeStep(prisma, progress.id, step);
}

async function unlockStep(prisma, stepId, studentId) {
  const progress = await prisma.stepProgress.findFirst({ where: { stepId, studentId } });
  if (!progress || progress.status !== 'pending_review') {
    throw new Error('Step is not pending review');
  }
  const step = await prisma.step.findUnique({ where: { id: stepId } });
  await prisma.stepProgress.update({ where: { id: progress.id }, data: { status: 'unlocked' } });
  return completeStep(prisma, progress.id, step);
}

async function toggleHelp(prisma, stepId, studentId, helpRequested) {
  const progress = await prisma.stepProgress.findFirst({ where: { stepId, studentId } });
  if (!progress) throw new Error('No progress row for this step/student');
  return prisma.stepProgress.update({ where: { id: progress.id }, data: { helpRequested } });
}

module.exports = { ensureProgress, submitAnswer, unlockStep, toggleHelp };
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
DATABASE_URL=file:./prisma/test.db npx jest --runInBand
```

Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add backend/src/progress
git commit -m "feat: add progress state machine with unit tests"
```

---

## Task 4: Express app, auth middleware, login/users routes

**Files:**
- Create: `backend/src/db.js`
- Create: `backend/src/middleware/auth.js`
- Create: `backend/src/middleware/auth.test.js`
- Create: `backend/src/routes/auth.js`
- Create: `backend/src/index.js`

**Interfaces:**
- Consumes: Prisma client (Task 2).
- Produces: `attachUser` (Express middleware), `requireAdmin`, `requireUser` (Express middleware) — imported by every route file in Tasks 5-8. `req.user` is a `User` row or `null`.

- [ ] **Step 1: Write the failing middleware test**

Create `backend/src/middleware/auth.test.js`:

```js
const { requireAdmin, requireUser } = require('./auth');

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('auth middleware', () => {
  test('requireAdmin rejects a student with 403', () => {
    const req = { user: { id: 2, role: 'student' } };
    const res = mockRes();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAdmin allows an admin through', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('requireUser rejects when no user is attached', () => {
    const req = { user: null };
    const res = mockRes();
    const next = jest.fn();
    requireUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('requireUser allows any logged-in user through', () => {
    const req = { user: { id: 3, role: 'student' } };
    const res = mockRes();
    const next = jest.fn();
    requireUser(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
DATABASE_URL=file:./prisma/test.db npx jest auth.test.js --runInBand
```

Expected: FAIL with `Cannot find module './auth'`.

- [ ] **Step 3: Implement db client and middleware**

Create `backend/src/db.js`:

```js
const { PrismaClient } = require('@prisma/client');
module.exports = new PrismaClient();
```

Create `backend/src/middleware/auth.js`:

```js
const prisma = require('../db');

async function attachUser(req, res, next) {
  const userId = req.header('x-user-id');
  if (!userId) {
    req.user = null;
    return next();
  }
  req.user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Login required' });
  }
  next();
}

module.exports = { attachUser, requireAdmin, requireUser };
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
DATABASE_URL=file:./prisma/test.db npx jest auth.test.js --runInBand
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Write the login/users routes**

Create `backend/src/routes/auth.js`:

```js
const express = require('express');
const prisma = require('../db');
const router = express.Router();

router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
  res.json(users);
});

router.post('/login', async (req, res) => {
  const { userId } = req.body;
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
```

- [ ] **Step 6: Wire up the Express app**

Create `backend/src/index.js`:

```js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const { attachUser } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use(attachUser);

app.use('/api', authRoutes);

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`EpiWork backend listening on :${PORT}`));
}

module.exports = app;
```

- [ ] **Step 7: Manually verify the server boots and responds**

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
npm run dev
```

In another terminal:

```bash
curl http://localhost:4000/api/users
```

Expected: JSON array of the 4 seeded users. Stop the server (Ctrl+C) when confirmed.

- [ ] **Step 8: Commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add backend/src/db.js backend/src/middleware backend/src/routes/auth.js backend/src/index.js
git commit -m "feat: add Express app, auth middleware, and login/users routes"
```

---

## Task 5: Workshop CRUD routes

**Files:**
- Create: `backend/src/routes/workshops.js`
- Modify: `backend/src/index.js`

**Interfaces:**
- Consumes: `requireAdmin`, `requireUser` from Task 4.
- Produces: `GET/POST /api/workshops`, `PATCH/DELETE /api/workshops/:id`. Response shape for `GET /api/workshops`: `[{ id, title, description, steps: [...] }]`, `steps` ordered by `order` — consumed by the frontend in Task 11-13.

- [ ] **Step 1: Implement the routes**

Create `backend/src/routes/workshops.js`:

```js
const express = require('express');
const prisma = require('../db');
const { requireAdmin, requireUser } = require('../middleware/auth');
const router = express.Router();

router.get('/workshops', requireUser, async (req, res) => {
  const workshops = await prisma.workshop.findMany({
    include: { steps: { orderBy: { order: 'asc' } } },
    orderBy: { id: 'asc' },
  });
  res.json(workshops);
});

router.post('/workshops', requireAdmin, async (req, res) => {
  const { title, description } = req.body;
  const workshop = await prisma.workshop.create({ data: { title, description: description || '' } });
  res.status(201).json(workshop);
});

router.patch('/workshops/:id', requireAdmin, async (req, res) => {
  const { title, description } = req.body;
  const workshop = await prisma.workshop.update({
    where: { id: Number(req.params.id) },
    data: { title, description },
  });
  res.json(workshop);
});

router.delete('/workshops/:id', requireAdmin, async (req, res) => {
  await prisma.step.deleteMany({ where: { workshopId: Number(req.params.id) } });
  await prisma.workshop.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

module.exports = router;
```

Note: deleting a workshop's steps first avoids a foreign-key error from Prisma/SQLite, since `Step.workshopId` has no cascade configured.

- [ ] **Step 2: Mount the router**

Edit `backend/src/index.js`, add near the other route mount:

```js
const workshopRoutes = require('./routes/workshops');
// ...
app.use('/api', workshopRoutes);
```

- [ ] **Step 3: Manually verify**

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
npm run dev
```

```bash
curl http://localhost:4000/api/workshops -H "x-user-id: 1"
curl -X POST http://localhost:4000/api/workshops -H "x-user-id: 1" -H "Content-Type: application/json" -d '{"title":"Test WS","description":"d"}'
curl -X POST http://localhost:4000/api/workshops -H "x-user-id: 2" -H "Content-Type: application/json" -d '{"title":"Should fail"}'
```

Expected: first call lists the seeded workshop with its steps; second creates one (201, admin id 1); third returns 403 (student id 2 is not admin). Stop the server when confirmed.

- [ ] **Step 4: Commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add backend/src/routes/workshops.js backend/src/index.js
git commit -m "feat: add workshop CRUD routes"
```

---

## Task 6: Step CRUD routes

**Files:**
- Create: `backend/src/routes/steps.js`
- Modify: `backend/src/index.js`

**Interfaces:**
- Consumes: `requireAdmin` from Task 4.
- Produces: `POST /api/workshops/:workshopId/steps`, `PATCH/DELETE /api/steps/:id`. Request body for create/update: `{ title, content, isCheckpoint, questionType, questionPrompt, questionOptions }` where `questionOptions` is a JS array (server JSON-stringifies it) — consumed by the frontend in Task 12.

- [ ] **Step 1: Implement the routes**

Create `backend/src/routes/steps.js`:

```js
const express = require('express');
const prisma = require('../db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.post('/workshops/:workshopId/steps', requireAdmin, async (req, res) => {
  const workshopId = Number(req.params.workshopId);
  const { title, content, isCheckpoint, questionType, questionPrompt, questionOptions } = req.body;
  const count = await prisma.step.count({ where: { workshopId } });
  const step = await prisma.step.create({
    data: {
      workshopId,
      order: count + 1,
      title,
      content: content || '',
      isCheckpoint: !!isCheckpoint,
      questionType: questionType || null,
      questionPrompt: questionPrompt || null,
      questionOptions: questionOptions ? JSON.stringify(questionOptions) : null,
    },
  });
  res.status(201).json(step);
});

router.patch('/steps/:id', requireAdmin, async (req, res) => {
  const { title, content, isCheckpoint, questionType, questionPrompt, questionOptions } = req.body;
  const step = await prisma.step.update({
    where: { id: Number(req.params.id) },
    data: {
      title,
      content,
      isCheckpoint,
      questionType: questionType || null,
      questionPrompt: questionPrompt || null,
      questionOptions: questionOptions ? JSON.stringify(questionOptions) : null,
    },
  });
  res.json(step);
});

router.delete('/steps/:id', requireAdmin, async (req, res) => {
  await prisma.stepProgress.deleteMany({ where: { stepId: Number(req.params.id) } });
  await prisma.step.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

module.exports = router;
```

- [ ] **Step 2: Mount the router**

Edit `backend/src/index.js`:

```js
const stepRoutes = require('./routes/steps');
// ...
app.use('/api', stepRoutes);
```

- [ ] **Step 3: Manually verify**

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
npm run dev
```

```bash
curl -X POST http://localhost:4000/api/workshops/1/steps -H "x-user-id: 1" -H "Content-Type: application/json" \
  -d '{"title":"New step","content":"do it","isCheckpoint":true,"questionType":"text","questionPrompt":"Explain"}'
```

Expected: 201 with the new step, `order: 4` (after the 3 seeded steps). Stop the server when confirmed.

- [ ] **Step 4: Commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add backend/src/routes/steps.js backend/src/index.js
git commit -m "feat: add step CRUD routes"
```

---

## Task 7: Student-facing progress routes (submit, help, my-progress)

**Files:**
- Create: `backend/src/routes/progress.js`
- Modify: `backend/src/index.js`

**Interfaces:**
- Consumes: `ensureProgress`, `submitAnswer`, `toggleHelp` from Task 3; `requireUser` from Task 4.
- Produces: `GET /api/me/workshops/:id`, `POST /api/steps/:id/submit`, `POST /api/steps/:id/help`. Response shape for `GET /api/me/workshops/:id`: array of `StepProgress` rows with `step` included — consumed by Task 11's `StepPage`.

- [ ] **Step 1: Implement the routes**

Create `backend/src/routes/progress.js`:

```js
const express = require('express');
const prisma = require('../db');
const { requireUser } = require('../middleware/auth');
const { ensureProgress, submitAnswer, toggleHelp } = require('../progress/stateMachine');
const router = express.Router();

router.get('/me/workshops/:id', requireUser, async (req, res) => {
  const workshopId = Number(req.params.id);
  const rows = await ensureProgress(prisma, workshopId, req.user.id);
  res.json(rows);
});

router.post('/steps/:id/submit', requireUser, async (req, res) => {
  try {
    const result = await submitAnswer(prisma, Number(req.params.id), req.user.id, req.body.answer ?? null);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/steps/:id/help', requireUser, async (req, res) => {
  const result = await toggleHelp(prisma, Number(req.params.id), req.user.id, true);
  res.json(result);
});

module.exports = router;
```

- [ ] **Step 2: Mount the router**

Edit `backend/src/index.js`:

```js
const progressRoutes = require('./routes/progress');
// ...
app.use('/api', progressRoutes);
```

- [ ] **Step 3: Manually verify**

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
npm run dev
```

```bash
curl http://localhost:4000/api/me/workshops/1 -H "x-user-id: 2"
curl -X POST http://localhost:4000/api/steps/1/submit -H "x-user-id: 2" -H "Content-Type: application/json" -d '{}'
curl http://localhost:4000/api/me/workshops/1 -H "x-user-id: 2"
```

Expected: first call shows step 1 `available`, steps 2-3 `locked`; submit marks step 1 `done`; second fetch shows step 2 now `available`. Stop the server when confirmed.

- [ ] **Step 4: Commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add backend/src/routes/progress.js backend/src/index.js
git commit -m "feat: add student-facing progress routes (my-progress, submit, help)"
```

---

## Task 8: Admin review routes (unlock, resolve-help, workshop progress, cross-workshop feed)

**Files:**
- Modify: `backend/src/routes/progress.js`

**Interfaces:**
- Consumes: `unlockStep`, `toggleHelp` from Task 3; `requireAdmin` from Task 4.
- Produces: `POST /api/steps/:id/unlock`, `POST /api/steps/:id/resolve-help`, `GET /api/workshops/:id/progress`, `GET /api/admin/feed`. `GET /api/workshops/:id/progress` returns `{ steps, students: [{ student, progress }] }` — consumed by Task 13 (`ProgressRail`) and Task 14 (`WorkshopReview`). `GET /api/admin/feed` returns `[{ student, workshopTitle, stepTitle, type: 'help'|'review', updatedAt }]` — consumed by Task 13 (`PriorityFeed`).

- [ ] **Step 1: Add the routes**

Append to `backend/src/routes/progress.js` (import `requireAdmin` and `unlockStep` alongside the existing imports at the top, then add these routes before `module.exports`):

```js
const { requireAdmin, requireUser } = require('../middleware/auth');
const { ensureProgress, submitAnswer, unlockStep, toggleHelp } = require('../progress/stateMachine');
```

```js
router.post('/steps/:id/unlock', requireAdmin, async (req, res) => {
  try {
    const result = await unlockStep(prisma, Number(req.params.id), Number(req.body.studentId));
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/steps/:id/resolve-help', requireAdmin, async (req, res) => {
  const result = await toggleHelp(prisma, Number(req.params.id), Number(req.body.studentId), false);
  res.json(result);
});

router.get('/workshops/:id/progress', requireAdmin, async (req, res) => {
  const workshopId = Number(req.params.id);
  const students = await prisma.user.findMany({ where: { role: 'student' } });
  const steps = await prisma.step.findMany({ where: { workshopId }, orderBy: { order: 'asc' } });
  const data = await Promise.all(
    students.map(async (student) => ({
      student,
      progress: await ensureProgress(prisma, workshopId, student.id),
    }))
  );
  res.json({ steps, students: data });
});

router.get('/admin/feed', requireAdmin, async (req, res) => {
  const rows = await prisma.stepProgress.findMany({
    where: { OR: [{ status: 'pending_review' }, { helpRequested: true }] },
    include: { step: { include: { workshop: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  const students = await prisma.user.findMany({ where: { role: 'student' } });
  const byId = Object.fromEntries(students.map((s) => [s.id, s]));
  const feed = rows.map((row) => ({
    student: byId[row.studentId],
    workshopTitle: row.step.workshop.title,
    stepTitle: row.step.title,
    type: row.helpRequested ? 'help' : 'review',
    updatedAt: row.updatedAt,
  }));
  res.json(feed);
});
```

Since `requireAdmin` and the state-machine imports now appear twice in the file (once from Task 7's version, once added here), replace the top of the file so the imports are combined once, not duplicated. The full corrected file:

```js
const express = require('express');
const prisma = require('../db');
const { requireAdmin, requireUser } = require('../middleware/auth');
const { ensureProgress, submitAnswer, unlockStep, toggleHelp } = require('../progress/stateMachine');
const router = express.Router();

router.get('/me/workshops/:id', requireUser, async (req, res) => {
  const workshopId = Number(req.params.id);
  const rows = await ensureProgress(prisma, workshopId, req.user.id);
  res.json(rows);
});

router.post('/steps/:id/submit', requireUser, async (req, res) => {
  try {
    const result = await submitAnswer(prisma, Number(req.params.id), req.user.id, req.body.answer ?? null);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/steps/:id/help', requireUser, async (req, res) => {
  const result = await toggleHelp(prisma, Number(req.params.id), req.user.id, true);
  res.json(result);
});

router.post('/steps/:id/unlock', requireAdmin, async (req, res) => {
  try {
    const result = await unlockStep(prisma, Number(req.params.id), Number(req.body.studentId));
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/steps/:id/resolve-help', requireAdmin, async (req, res) => {
  const result = await toggleHelp(prisma, Number(req.params.id), Number(req.body.studentId), false);
  res.json(result);
});

router.get('/workshops/:id/progress', requireAdmin, async (req, res) => {
  const workshopId = Number(req.params.id);
  const students = await prisma.user.findMany({ where: { role: 'student' } });
  const steps = await prisma.step.findMany({ where: { workshopId }, orderBy: { order: 'asc' } });
  const data = await Promise.all(
    students.map(async (student) => ({
      student,
      progress: await ensureProgress(prisma, workshopId, student.id),
    }))
  );
  res.json({ steps, students: data });
});

router.get('/admin/feed', requireAdmin, async (req, res) => {
  const rows = await prisma.stepProgress.findMany({
    where: { OR: [{ status: 'pending_review' }, { helpRequested: true }] },
    include: { step: { include: { workshop: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  const students = await prisma.user.findMany({ where: { role: 'student' } });
  const byId = Object.fromEntries(students.map((s) => [s.id, s]));
  const feed = rows.map((row) => ({
    student: byId[row.studentId],
    workshopTitle: row.step.workshop.title,
    stepTitle: row.step.title,
    type: row.helpRequested ? 'help' : 'review',
    updatedAt: row.updatedAt,
  }));
  res.json(feed);
});

module.exports = router;
```

- [ ] **Step 2: Manually verify the full checkpoint loop**

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
npm run dev
```

```bash
curl -X POST http://localhost:4000/api/steps/2/submit -H "x-user-id: 2" -H "Content-Type: application/json" -d '{"answer":"10.0.0.0/24, it was free"}'
curl http://localhost:4000/api/admin/feed -H "x-user-id: 1"
curl -X POST http://localhost:4000/api/steps/2/unlock -H "x-user-id: 1" -H "Content-Type: application/json" -d '{"studentId":2}'
curl http://localhost:4000/api/workshops/1/progress -H "x-user-id: 1"
```

(Step ids assume the Task 2 seed and Task 6 manual test both ran against the same dev.db — adjust ids from the actual `GET /api/workshops` response if they differ.)

Expected: submit puts step 2 into `pending_review`; the feed shows Alice awaiting review; unlock moves it to `done` and step 3 becomes `available`; the progress view reflects this for all seeded students. Stop the server when confirmed.

- [ ] **Step 3: Commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add backend/src/routes/progress.js
git commit -m "feat: add admin review routes (unlock, resolve-help, progress, feed)"
```

---

## Task 9: Frontend scaffolding — theme, fonts, API client, auth storage

**Files:**
- Modify: `frontend/index.html`
- Create: `frontend/src/theme.js`
- Create: `frontend/src/api.js`
- Create: `frontend/vite.config.js` (modify the Vite-generated one)

**Interfaces:**
- Produces: `theme` (Mantine theme object), `signalColors` (object with `needsHelp`, `needsHelpText`, `awaitingReview`, `done`, `sectionBar`, `destructive` hex strings) from `theme.js`; `api` object and `currentUser()`/`setCurrentUser()` from `api.js` — consumed by every page/component in Tasks 10-14.

- [ ] **Step 1: Add the Epitech-matching fonts to index.html**

Edit `frontend/index.html`, add inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Mono:wght@400;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 2: Write the Mantine theme and signal colors**

Create `frontend/src/theme.js`:

```js
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'periwinkle',
  colors: {
    periwinkle: [
      '#EEF0FF', '#DCE0FF', '#B8C0E8', '#A3AEFB', '#8E9AFB',
      '#809DFD', '#6B79E8', '#5561C9', '#4048A8', '#2E3488',
    ],
    dark: [
      '#FFFFFF', '#C9C9C9', '#B8B8B8', '#828282', '#696969',
      '#424242', '#3B3B3B', '#2E2E2E', '#242424', '#181818',
    ],
  },
  fontFamily: '"IBM Plex Sans", sans-serif',
  headings: { fontFamily: '"Anton", sans-serif', textTransform: 'uppercase' },
  defaultRadius: 'sm',
});

export const signalColors = {
  needsHelp: '#FF5F3A',
  needsHelpText: '#FF9980',
  awaitingReview: '#29D9FF',
  done: '#00FF97',
  sectionBar: '#FF1EF7',
  destructive: '#EF4B4B',
};
```

- [ ] **Step 3: Write the API client**

Create `frontend/src/api.js`:

```js
const BASE = '/api';

export function currentUser() {
  const raw = localStorage.getItem('epiwork_user');
  return raw ? JSON.parse(raw) : null;
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('epiwork_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('epiwork_user');
  }
}

async function request(path, options = {}) {
  const user = currentUser();
  const res = await fetch(BASE + path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(user ? { 'x-user-id': String(user.id) } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listUsers: () => request('/users'),
  login: (userId) => request('/login', { method: 'POST', body: { userId } }),
  listWorkshops: () => request('/workshops'),
  createWorkshop: (data) => request('/workshops', { method: 'POST', body: data }),
  updateWorkshop: (id, data) => request(`/workshops/${id}`, { method: 'PATCH', body: data }),
  deleteWorkshop: (id) => request(`/workshops/${id}`, { method: 'DELETE' }),
  createStep: (workshopId, data) => request(`/workshops/${workshopId}/steps`, { method: 'POST', body: data }),
  updateStep: (id, data) => request(`/steps/${id}`, { method: 'PATCH', body: data }),
  deleteStep: (id) => request(`/steps/${id}`, { method: 'DELETE' }),
  myWorkshopProgress: (workshopId) => request(`/me/workshops/${workshopId}`),
  submitStep: (stepId, answer) => request(`/steps/${stepId}/submit`, { method: 'POST', body: { answer } }),
  requestHelp: (stepId) => request(`/steps/${stepId}/help`, { method: 'POST', body: {} }),
  resolveHelp: (stepId, studentId) => request(`/steps/${stepId}/resolve-help`, { method: 'POST', body: { studentId } }),
  unlockStep: (stepId, studentId) => request(`/steps/${stepId}/unlock`, { method: 'POST', body: { studentId } }),
  workshopProgress: (workshopId) => request(`/workshops/${workshopId}/progress`),
  adminFeed: () => request('/admin/feed'),
};
```

- [ ] **Step 4: Add the dev-server proxy so the frontend can call `/api` without CORS friction**

Edit `frontend/vite.config.js` to match:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
```

- [ ] **Step 5: Commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add frontend/index.html frontend/src/theme.js frontend/src/api.js frontend/vite.config.js
git commit -m "feat: add Mantine theme, fonts, API client, and dev proxy"
```

---

## Task 10: Login page, routing shell, and auth guard

**Files:**
- Modify: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/pages/Login.jsx`
- Create: `frontend/src/components/AppShell.jsx`
- Delete: `frontend/src/App.css` (Vite template default styling, no longer used)

**Interfaces:**
- Consumes: `theme`, `api`, `currentUser`, `setCurrentUser` from Task 9.
- Produces: routes `/login` and `/*` (guarded). `AppShell` component takes `{ user, children }` props — consumed by Tasks 11-14's pages, which render inside it via `App.jsx`.

- [ ] **Step 1: Set up the Mantine provider and router in main.jsx**

Replace `frontend/src/main.jsx` with:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { theme } from './theme';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
);
```

- [ ] **Step 2: Write the login page**

Create `frontend/src/pages/Login.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Stack, Text, Title } from '@mantine/core';
import { api, setCurrentUser } from '../api';

export default function Login() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.listUsers().then(setUsers);
  }, []);

  function pick(user) {
    setCurrentUser(user);
    navigate('/');
  }

  const admin = users.find((u) => u.role === 'admin');
  const students = users.filter((u) => u.role === 'student');

  return (
    <Stack align="center" justify="center" mih="100vh" gap="md">
      <Title order={1}>{'{ EPIWORK }'}</Title>
      <Text c="dimmed">Who&apos;s logging in?</Text>
      {admin && <Button size="md" onClick={() => pick(admin)}>I&apos;m the Admin</Button>}
      <Stack gap="xs">
        {students.map((s) => (
          <Button key={s.id} variant="outline" onClick={() => pick(s)}>
            {s.name}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
```

- [ ] **Step 3: Write the app shell (sidebar/topbar identity chrome)**

Create `frontend/src/components/AppShell.jsx`:

```jsx
import { AppShell as MantineAppShell, Group, NavLink, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { setCurrentUser } from '../api';

export default function AppShell({ user, children }) {
  const navigate = useNavigate();

  function logout() {
    setCurrentUser(null);
    navigate('/login');
  }

  return (
    <MantineAppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={4}>{'{ EPIWORK }'}</Title>
          <Group>
            <Text size="sm" c="dimmed">{user?.name?.toUpperCase()}</Text>
            <Text size="sm" c="dimmed" onClick={logout} style={{ cursor: 'pointer' }}>
              Log out
            </Text>
          </Group>
        </Group>
      </MantineAppShell.Header>
      <MantineAppShell.Navbar p="md">
        <Text size="xs" c="dimmed" ff="monospace" mb="xs">{'< OVERVIEW />'}</Text>
        <NavLink label={user?.role === 'admin' ? 'Home' : 'Workshops'} onClick={() => navigate('/')} />
      </MantineAppShell.Navbar>
      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}
```

- [ ] **Step 4: Write App.jsx with the auth-guarded route tree**

Create `frontend/src/App.jsx` (the admin-only page imports here are placeholders that Tasks 12-14 will create — the app won't run correctly until then, that's fine at this step):

```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { currentUser } from './api';
import Login from './pages/Login';
import AppShell from './components/AppShell';
import WorkshopList from './pages/student/WorkshopList';
import StepPage from './pages/student/StepPage';
import AdminHome from './pages/admin/AdminHome';
import WorkshopEditor from './pages/admin/WorkshopEditor';
import WorkshopReview from './pages/admin/WorkshopReview';

function RequireUser({ children }) {
  const user = currentUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const user = currentUser();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <RequireUser>
            <AppShell user={user}>
              <Routes>
                {user?.role === 'admin' ? (
                  <>
                    <Route path="/" element={<AdminHome />} />
                    <Route path="/workshops/:id/edit" element={<WorkshopEditor />} />
                    <Route path="/workshops/:id/review" element={<WorkshopReview />} />
                  </>
                ) : (
                  <>
                    <Route path="/" element={<WorkshopList />} />
                    <Route path="/workshops/:id" element={<StepPage />} />
                  </>
                )}
              </Routes>
            </AppShell>
          </RequireUser>
        }
      />
    </Routes>
  );
}
```

- [ ] **Step 5: Remove the unused Vite template CSS**

```bash
cd /Users/pandorian/Delivery/EpiWork/frontend
rm -f src/App.css
```

Remove the `import './App.css'` line if the Vite template put one anywhere (check `src/main.jsx` — the version written in Step 1 above doesn't have it).

- [ ] **Step 6: Commit**

This won't build yet (Tasks 11-14 pages don't exist) — that's expected for this task; the build is verified once Task 14 lands. Commit anyway to keep history bite-sized:

```bash
cd /Users/pandorian/Delivery/EpiWork
git add frontend/src/main.jsx frontend/src/App.jsx frontend/src/pages/Login.jsx frontend/src/components/AppShell.jsx
git rm --cached frontend/src/App.css 2>/dev/null || true
git commit -m "feat: add login page, app shell, and auth-guarded routing"
```

---

## Task 11: Student pages — workshop list and step page

**Files:**
- Create: `frontend/src/pages/student/WorkshopList.jsx`
- Create: `frontend/src/pages/student/StepPage.jsx`

**Interfaces:**
- Consumes: `api` from Task 9; rendered inside `AppShell` via the routes defined in Task 10's `App.jsx`.
- Produces: nothing consumed by later tasks (leaf pages).

- [ ] **Step 1: Write the workshop list**

Create `frontend/src/pages/student/WorkshopList.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Card, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function WorkshopList() {
  const [workshops, setWorkshops] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.listWorkshops().then(setWorkshops);
  }, []);

  return (
    <Stack>
      <Title order={2}>Workshops</Title>
      {workshops.map((w) => (
        <Card key={w.id} withBorder onClick={() => navigate(`/workshops/${w.id}`)} style={{ cursor: 'pointer' }}>
          <Text fw={600}>{w.title}</Text>
          <Text size="sm" c="dimmed">{w.description}</Text>
        </Card>
      ))}
    </Stack>
  );
}
```

- [ ] **Step 2: Write the step page with the split-column layout**

Create `frontend/src/pages/student/StepPage.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Grid, Group, Radio, Stack, Text, Textarea, Title } from '@mantine/core';
import { api } from '../../api';
import { signalColors } from '../../theme';

export default function StepPage() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [activeStepId, setActiveStepId] = useState(null);
  const [answer, setAnswer] = useState('');

  async function load() {
    const data = await api.myWorkshopProgress(id);
    setRows(data);
    const firstActionable = data.find((r) => r.status === 'available' || r.status === 'pending_review');
    setActiveStepId(firstActionable ? firstActionable.stepId : data[data.length - 1]?.stepId);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const active = rows.find((r) => r.stepId === activeStepId);
  if (!active) return <Text>Loading...</Text>;

  async function submit() {
    await api.submitStep(active.stepId, answer);
    setAnswer('');
    load();
  }

  async function requestHelp() {
    await api.requestHelp(active.stepId);
    load();
  }

  const options = active.step.questionOptions ? JSON.parse(active.step.questionOptions) : [];
  const canSubmit =
    active.step.questionType === 'text' ? answer.trim().length > 0 :
    active.step.questionType === 'multiple_choice' ? !!answer :
    true;

  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Title order={3}>{active.step.title}</Title>
        <Text mt="sm">{active.step.content}</Text>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Stack>
          {active.status === 'pending_review' ? (
            <Text c="dimmed">Waiting for the admin to review your answer.</Text>
          ) : active.step.isCheckpoint ? (
            <>
              {active.step.questionType === 'multiple_choice' ? (
                <Radio.Group label={active.step.questionPrompt} value={answer} onChange={setAnswer}>
                  <Stack gap="xs" mt="xs">
                    {options.map((opt) => (
                      <Radio key={opt} value={opt} label={opt} />
                    ))}
                  </Stack>
                </Radio.Group>
              ) : active.step.questionType === 'confirm' ? (
                <Text c="dimmed">{active.step.questionPrompt || 'Confirm you completed this step.'}</Text>
              ) : (
                <Textarea
                  label={active.step.questionPrompt}
                  value={answer}
                  onChange={(e) => setAnswer(e.currentTarget.value)}
                  autosize
                  minRows={4}
                />
              )}
              <Button onClick={submit} disabled={!canSubmit}>Submit answer</Button>
            </>
          ) : (
            <Button onClick={submit}>Mark done, next step</Button>
          )}
          <Group>
            <Button
              variant="outline"
              styles={{ root: { borderColor: signalColors.needsHelp, color: signalColors.needsHelpText } }}
              onClick={requestHelp}
              disabled={active.helpRequested}
            >
              {active.helpRequested ? 'Help requested' : 'I need help'}
            </Button>
          </Group>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add frontend/src/pages/student
git commit -m "feat: add student workshop list and step page"
```

---

## Task 12: Admin workshop editor

**Files:**
- Create: `frontend/src/pages/admin/WorkshopEditor.jsx`

**Interfaces:**
- Consumes: `api` from Task 9.
- Produces: nothing consumed by later tasks (leaf page), routed at `/workshops/:id/edit` (Task 10).

- [ ] **Step 1: Write the workshop editor**

Create `frontend/src/pages/admin/WorkshopEditor.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Checkbox, Group, Paper, Select, Stack, Text, TextInput, Textarea, Title } from '@mantine/core';
import { api } from '../../api';

const EMPTY_STEP = { title: '', content: '', isCheckpoint: false, questionType: '', questionPrompt: '', questionOptions: '' };

export default function WorkshopEditor() {
  const { id } = useParams();
  const [workshop, setWorkshop] = useState(null);
  const [form, setForm] = useState(EMPTY_STEP);

  async function load() {
    const workshops = await api.listWorkshops();
    setWorkshop(workshops.find((w) => String(w.id) === id));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function addStep() {
    const payload = {
      title: form.title,
      content: form.content,
      isCheckpoint: form.isCheckpoint,
      questionType: form.isCheckpoint ? form.questionType || 'confirm' : null,
      questionOptions:
        form.isCheckpoint && form.questionType === 'multiple_choice'
          ? form.questionOptions.split(',').map((s) => s.trim()).filter(Boolean)
          : null,
      questionPrompt: form.isCheckpoint ? form.questionPrompt : null,
    };
    await api.createStep(id, payload);
    setForm(EMPTY_STEP);
    load();
  }

  async function removeStep(stepId) {
    await api.deleteStep(stepId);
    load();
  }

  if (!workshop) return <Text>Loading...</Text>;

  return (
    <Stack>
      <Title order={2}>{workshop.title}</Title>
      <Stack gap="xs">
        {workshop.steps.map((s) => (
          <Paper key={s.id} withBorder p="sm">
            <Group justify="space-between">
              <div>
                <Text fw={600}>
                  {s.order}. {s.title}{s.isCheckpoint ? ' (checkpoint)' : ''}
                </Text>
                <Text size="sm" c="dimmed">{s.content}</Text>
              </div>
              <Button color="red" variant="subtle" onClick={() => removeStep(s.id)}>Remove</Button>
            </Group>
          </Paper>
        ))}
      </Stack>

      <Title order={4} mt="md">Add a step</Title>
      <TextInput label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.currentTarget.value })} />
      <Textarea label="Subject / instructions" value={form.content} onChange={(e) => setForm({ ...form, content: e.currentTarget.value })} />
      <Checkbox
        label="This is a checkpoint (needs admin review)"
        checked={form.isCheckpoint}
        onChange={(e) => setForm({ ...form, isCheckpoint: e.currentTarget.checked })}
      />
      {form.isCheckpoint && (
        <>
          <Select
            label="Question type"
            data={[
              { value: 'text', label: 'Free text' },
              { value: 'multiple_choice', label: 'Multiple choice' },
              { value: 'confirm', label: 'Simple confirmation' },
            ]}
            value={form.questionType}
            onChange={(v) => setForm({ ...form, questionType: v })}
          />
          <TextInput
            label="Question prompt"
            value={form.questionPrompt}
            onChange={(e) => setForm({ ...form, questionPrompt: e.currentTarget.value })}
          />
          {form.questionType === 'multiple_choice' && (
            <TextInput
              label="Options (comma-separated)"
              value={form.questionOptions}
              onChange={(e) => setForm({ ...form, questionOptions: e.currentTarget.value })}
            />
          )}
        </>
      )}
      <Button onClick={addStep} disabled={!form.title.trim()}>Add step</Button>
    </Stack>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add frontend/src/pages/admin/WorkshopEditor.jsx
git commit -m "feat: add admin workshop editor"
```

---

## Task 13: Admin home dashboard — progress rail and priority feed

**Files:**
- Create: `frontend/src/components/SectionHeader.jsx`
- Create: `frontend/src/components/ProgressRail.jsx`
- Create: `frontend/src/components/PriorityFeed.jsx`
- Create: `frontend/src/pages/admin/AdminHome.jsx`

**Interfaces:**
- Consumes: `api`, `signalColors` from Task 9.
- Produces: `SectionHeader({ children })`, `ProgressRail({ workshop, studentsProgress })`, `PriorityFeed({ items })` — used by `AdminHome` in this task; `SectionHeader` is also reusable by any later page that needs the spec's magenta-bar section-heading motif (spec §7).

- [ ] **Step 1: Write the section header (magenta bar motif)**

Create `frontend/src/components/SectionHeader.jsx`:

```jsx
import { Group, Title } from '@mantine/core';
import { signalColors } from '../theme';

export default function SectionHeader({ children }) {
  return (
    <Group gap="xs" align="center">
      <div style={{ width: 4, height: 16, background: signalColors.sectionBar, borderRadius: 2 }} />
      <Title order={3}>{children}</Title>
    </Group>
  );
}
```

- [ ] **Step 2: Write the progress rail**

Create `frontend/src/components/ProgressRail.jsx`:

```jsx
import { Group, Paper, Text, Tooltip } from '@mantine/core';
import { signalColors } from '../theme';

const STATUS_COLOR = {
  done: signalColors.done,
  pending_review: signalColors.awaitingReview,
  available: '#C7C8D1',
  locked: '#4A4A4A',
  unlocked: signalColors.done,
};

function dotColor(row) {
  if (row.helpRequested) return signalColors.needsHelp;
  return STATUS_COLOR[row.status] || '#4A4A4A';
}

export default function ProgressRail({ workshop, studentsProgress }) {
  const totalSteps = workshop.steps.length;
  return (
    <Paper withBorder p="sm" mb="sm">
      <Group justify="space-between" mb="xs">
        <Text fw={600}>{workshop.title}</Text>
        <Text size="xs" c="dimmed" ff="monospace">
          {studentsProgress.length} students · step 1-{totalSteps}
        </Text>
      </Group>
      <div style={{ position: 'relative', height: 20, background: '#242424', borderRadius: 3 }}>
        {studentsProgress.map(({ student, progress }) => {
          const currentIndex = progress.findIndex((r) => r.status !== 'done');
          const stepIndex = currentIndex === -1 ? totalSteps - 1 : currentIndex;
          const left = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 50;
          const row = progress[stepIndex];
          if (!row) return null;
          return (
            <Tooltip key={student.id} label={`${student.name} — step ${stepIndex + 1}`}>
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: `${left}%`,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: dotColor(row),
                  border: '2px solid #141414',
                  transform: 'translateX(-50%)',
                }}
              />
            </Tooltip>
          );
        })}
      </div>
    </Paper>
  );
}
```

- [ ] **Step 3: Write the priority feed**

Create `frontend/src/components/PriorityFeed.jsx`:

```jsx
import { Paper, Stack, Text } from '@mantine/core';
import { signalColors } from '../theme';

export default function PriorityFeed({ items }) {
  return (
    <Stack gap={6}>
      {items.length === 0 && <Text c="dimmed">Nothing needs attention right now.</Text>}
      {items.map((item, i) => (
        <Paper
          key={i}
          p="xs"
          style={{
            borderLeft: `3px solid ${item.type === 'help' ? signalColors.needsHelp : signalColors.awaitingReview}`,
            background: '#242424',
          }}
        >
          <Text size="sm">
            <b>{item.student?.name}</b>{' '}
            {item.type === 'help' ? 'needs help' : 'awaiting review'} — {item.workshopTitle}, {item.stepTitle}
          </Text>
        </Paper>
      ))}
    </Stack>
  );
}
```

- [ ] **Step 4: Write the admin home page**

Create `frontend/src/pages/admin/AdminHome.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Button, Group, Stack, TextInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import SectionHeader from '../../components/SectionHeader';
import ProgressRail from '../../components/ProgressRail';
import PriorityFeed from '../../components/PriorityFeed';

export default function AdminHome() {
  const [workshops, setWorkshops] = useState([]);
  const [progressByWorkshop, setProgressByWorkshop] = useState({});
  const [feed, setFeed] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  async function load() {
    const ws = await api.listWorkshops();
    setWorkshops(ws);
    const entries = await Promise.all(ws.map((w) => api.workshopProgress(w.id)));
    setProgressByWorkshop(Object.fromEntries(ws.map((w, i) => [w.id, entries[i]])));
    setFeed(await api.adminFeed());
  }

  useEffect(() => {
    load();
  }, []);

  async function createWorkshop() {
    if (!newTitle.trim()) return;
    const w = await api.createWorkshop({ title: newTitle, description: '' });
    setNewTitle('');
    navigate(`/workshops/${w.id}/edit`);
  }

  return (
    <Stack>
      <SectionHeader>Class progress</SectionHeader>
      {workshops.map((w) => (
        <div key={w.id} onClick={() => navigate(`/workshops/${w.id}/review`)} style={{ cursor: 'pointer' }}>
          <ProgressRail workshop={w} studentsProgress={progressByWorkshop[w.id]?.students || []} />
        </div>
      ))}

      <Group>
        <TextInput
          placeholder="New workshop title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.currentTarget.value)}
        />
        <Button onClick={createWorkshop}>New workshop</Button>
      </Group>

      <div style={{ marginTop: 24 }}>
        <SectionHeader>Priority_</SectionHeader>
      </div>
      <PriorityFeed items={feed} />
    </Stack>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add frontend/src/components/SectionHeader.jsx frontend/src/components/ProgressRail.jsx frontend/src/components/PriorityFeed.jsx frontend/src/pages/admin/AdminHome.jsx
git commit -m "feat: add admin home dashboard with progress rail and priority feed"
```

---

## Task 14: Admin workshop review page

**Files:**
- Create: `frontend/src/pages/admin/WorkshopReview.jsx`

**Interfaces:**
- Consumes: `api` from Task 9.
- Produces: nothing consumed by later tasks (leaf page, last piece of the frontend route tree from Task 10).

- [ ] **Step 1: Write the review page**

Create `frontend/src/pages/admin/WorkshopReview.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { api } from '../../api';

export default function WorkshopReview() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  async function load() {
    setData(await api.workshopProgress(id));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!data) return <Text>Loading...</Text>;

  async function unlock(stepId, studentId) {
    await api.unlockStep(stepId, studentId);
    load();
  }

  async function resolveHelp(stepId, studentId) {
    await api.resolveHelp(stepId, studentId);
    load();
  }

  return (
    <Stack>
      <Title order={2}>Review</Title>
      {data.students.map(({ student, progress }) => (
        <Paper key={student.id} withBorder p="sm">
          <Text fw={600}>{student.name}</Text>
          <Stack gap={4} mt="xs">
            {progress.map((row) => (
              <Group key={row.stepId} justify="space-between">
                <Text size="sm">
                  {row.step.title} — {row.status}
                  {row.helpRequested ? ' · needs help' : ''}
                </Text>
                <Group gap="xs">
                  {row.status === 'pending_review' && (
                    <>
                      <Badge color="cyan">{row.submittedAnswer || 'confirmed'}</Badge>
                      <Button size="xs" onClick={() => unlock(row.stepId, student.id)}>Unlock</Button>
                    </>
                  )}
                  {row.helpRequested && (
                    <Button size="xs" color="orange" onClick={() => resolveHelp(row.stepId, student.id)}>
                      Resolve help
                    </Button>
                  )}
                </Group>
              </Group>
            ))}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git add frontend/src/pages/admin/WorkshopReview.jsx
git commit -m "feat: add admin workshop review page"
```

---

## Task 15: Full end-to-end manual verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Run the full backend test suite**

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
npm test
```

Expected: all tests pass (from Tasks 3 and 4 — 9 state-machine tests + 4 middleware tests).

- [ ] **Step 2: Reset dev data and start both servers**

```bash
cd /Users/pandorian/Delivery/EpiWork/backend
rm -f prisma/dev.db
npx prisma migrate deploy
npm run seed
npm run dev
```

In a second terminal:

```bash
cd /Users/pandorian/Delivery/EpiWork/frontend
npm run dev
```

- [ ] **Step 3: Walk the full loop in a browser**

Open the frontend's printed URL (typically `http://localhost:5173`) and:

1. Log in as a student (e.g. Alice). Confirm the workshop list shows "Networking Basics".
2. Open it. Confirm step 1 ("Set up your VM") is shown, split-column layout with subject on the left and a "Mark done, next step" button on the right.
3. Click "Mark done, next step". Confirm step 2 ("Configure a static IP") appears, with a free-text question on the right.
4. Click "I need help" on step 2. Confirm the button becomes disabled and reads "Help requested".
5. Type an answer and click "Submit answer". Confirm the right column now shows "Waiting for the admin to review your answer."
6. Log out, log back in as the Admin.
7. On the admin home page, confirm the progress rail shows one dot at step 2 colored orange (needs help — help flag takes visual priority over the awaiting-review state per the `dotColor` logic in `ProgressRail.jsx`).
8. Confirm the priority feed lists Alice needing help and/or awaiting review on "Networking Basics".
9. Click into the workshop's review page. Confirm Alice's row shows her submitted answer and an "Unlock" button, plus a "Resolve help" button.
10. Click "Resolve help", then "Unlock". Confirm both actions update the row (help button disappears, status moves toward `done`).
11. Log back in as Alice. Confirm step 3 ("Trace a route") is now available and the workshop can be completed.
12. As the Admin, create a new workshop via the home page's "New workshop" field, add at least one checkpoint step with a multiple-choice question, and confirm the editor lists it correctly.

- [ ] **Step 4: Fix any issues found during the walkthrough**

If any step in Step 3 doesn't behave as described, fix the underlying task's code, re-run the relevant backend tests (Step 1) if backend code changed, and re-walk the affected part of Step 3.

- [ ] **Step 5: Final commit**

```bash
cd /Users/pandorian/Delivery/EpiWork
git status
git add -A
git commit -m "chore: fix issues found during end-to-end verification" --allow-empty
```

(If Step 4 required no fixes, this commit will be empty — that's fine, it marks the verification checkpoint in history. If there were fixes, they should already be staged from Step 4's own commits — check `git status` first and only run this if something is still uncommitted.)
