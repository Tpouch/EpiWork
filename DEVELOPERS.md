# EpiWork: developer guide

Everything needed to run, change and ship EpiWork. For what the product is and who it is for, read the [README](README.md) first.

EpiWork is a proof of concept: the code favors clarity and fast iteration over scale or production hardening. Coding rules and the working agreement for contributors (human or AI) are in [CLAUDE.md](CLAUDE.md).

## Contents

- [Stack](#stack)
- [Getting started](#getting-started)
- [Running with Docker](#running-with-docker)
- [Tests and checks](#tests-and-checks)
- [Repository layout](#repository-layout)
- [Architecture](#architecture)
- [Data model](#data-model)
- [API overview](#api-overview)
- [Frontend](#frontend)
- [Database tasks](#database-tasks)
- [CI and code quality](#ci-and-code-quality)
- [Git workflow](#git-workflow)

## Stack

| Layer | Tools |
|---|---|
| Runtime | Node.js 24, pnpm 10.30.1 (**pnpm only**, never npm or yarn) |
| Backend | Express 5, Prisma 7 with the `better-sqlite3` driver adapter, SQLite |
| Frontend | React 19, Vite 8, react-router-dom 7 |
| UI | Tailwind CSS v4, shadcn/ui components on Base UI, lucide-react icons, neo-brutalist theme |
| Tests | Jest 30 (backend only) |
| Lint | oxlint (frontend) |
| Quality | SonarQube, run from GitHub Actions |

## Getting started

### Prerequisites

- Node.js 24
- pnpm 10 (Docker and CI use 10.30.1: `corepack enable && corepack prepare pnpm@10.30.1 --activate`)

### 1. Configure the environment

Copy the example file to the **repository root** and fill it in:

```bash
cp backend/.env.example .env
```

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | SQLite file, e.g. `file:./prisma/dev.db` (resolved from `backend/`). |
| `ADMIN_PASSWORD` | yes | Initial password of the default admin `admin@devgoblin.fr`. Only used while that account has no password: once changed from "My account", the app wins over `.env`. |
| `PORT` | no | API port, `4000` by default. |

`backend/src/db.js` and `backend/prisma.config.js` read the root `.env` themselves. A variable already set in the shell takes priority over the file, which is how the test script points Prisma at a separate database.

Never commit `.env` or a `.db` file.

### 2. Start the backend

```bash
cd backend
pnpm install
pnpm exec prisma migrate deploy
pnpm seed
pnpm dev
```

The API listens on `http://localhost:4000`, every route under `/api`. On start it creates the default admin if it does not exist yet.

> **Warning:** `pnpm seed` deletes every user, workshop, step and progress row before inserting the demo data. Do not run it on a database you want to keep.

### 3. Start the frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `http://localhost:4000`; set `VITE_API_PROXY_TARGET` to point it somewhere else.

### Development accounts

| Account | Email | Password |
|---|---|---|
| Default admin | `admin@devgoblin.fr` | `ADMIN_PASSWORD` from `.env` |
| Seeded students | `alice.martin@epitech.eu`, `bilal.haddad@epitech.eu`, `chloe.bernard@epitech.eu` | `student123` |

Students can also sign up from the login page with any `firstname.lastname@epitech.eu` address. Other admins are created from the **Accounts** page. The seed also creates one demo workshop, *Networking Basics* (3 steps, 1 checkpoint).

## Running with Docker

```bash
docker compose up --build
```

- **backend** (port 4000): on each start the entrypoint runs `prisma migrate deploy`, then seeds the database **once** (a `/data/.seeded` marker prevents re-seeding). The SQLite file lives in the `backend-data` volume at `/data/dev.db`. Variables come from the root `.env` if present.
- **frontend** (port 5173): serves the **production build** with `vite preview`, proxying `/api` to the backend container. The dev server is not used in Docker because its on-the-fly dependency bundling breaks behind a reverse proxy.
- Both containers run as the unprivileged `node` user.

`docker compose watch` syncs `backend/src` and restarts the API on change, and rebuilds an image when its `package.json` or lockfile changes. The frontend serves a build, so frontend source changes only show up after a rebuild.

To reset the Docker database, remove the volume: `docker compose down -v`.

## Tests and checks

### Backend

```bash
cd backend
pnpm test              # runs every *.test.js with Jest
pnpm test --coverage   # same, writes backend/coverage/lcov.info
```

The test script migrates and uses its own database, `prisma/test.db`, so your dev data is never touched. Tests live next to the code they cover (`foo.js` → `foo.test.js`) and focus on pure logic and middleware: progress rules, account rules, password hashing, tokens, run summaries, auth middleware.

### Frontend

There are no automated frontend tests. Before opening a PR:

```bash
cd frontend
pnpm build   # compile check + production build
pnpm lint    # oxlint
```

Then click through the changed flow by hand: the happy path, the loading, error and empty states, an action the backend refuses, and a page reload to check the data persisted.

## Repository layout

```
backend/
  prisma/
    schema.prisma         # data model, single source of truth
    migrations/           # SQL migrations, one folder per change
    seed.js               # demo data (wipes the database first)
  prisma.config.js        # Prisma 7 config, loads the root .env
  docker-entrypoint.sh    # migrate, seed once, start
  src/
    index.js              # Express app; listen() only when run directly
    db.js                 # the single PrismaClient instance
    middleware/auth.js    # attachUser, requireUser, requireAdmin
    routes/               # HTTP layer, one file per area
    accounts/             # login, signup, passwords, tokens, account rules
    progress/             # step progress state machine
    sessions/             # live session, join codes, events, runs
    students/             # student dashboard and progress summaries
    feedback/             # end-of-workshop ratings
frontend/
  index.html
  vite.config.js          # React + Tailwind plugins, @ alias, /api proxy
  src/
    main.jsx              # router + global CSS
    App.jsx               # all routes, split by role
    api.js                # the only module that calls fetch
    index.css             # Tailwind + brutal theme tokens (light and dark)
    theme.js              # progress signal colors
    lib/                  # theme toggle, accent colors, small helpers
    pages/                # one component per route (admin/, student/)
    components/           # app components; ui/ holds the shadcn primitives
docs/superpowers/         # design specs and implementation plans per feature
docker-compose.yml
sonar-project.properties
```

## Architecture

```
React page → api.js → /api (Vite proxy) → Express route → feature module → Prisma → SQLite
```

- **Routes** (`src/routes/`) parse and validate the request, call a feature module, and map the result to a status code and JSON.
- **Feature modules** (`accounts/`, `progress/`, `sessions/`, `students/`, `feedback/`) hold the business rules and the Prisma calls. They receive plain values (ids, payloads, and the Prisma client), never `req` or `res`, which keeps them testable with a stubbed client.
- **`index.js`** builds the app without calling `listen()` when it is imported, so tests can load it without starting a server.

### Authentication

- Passwords are hashed with Node's built-in `crypto.scrypt` and a random salt.
- Logging in creates a row in `Session` holding the **hash** of a random token. The client stores the token and sends it as `Authorization: Bearer <token>`.
- `attachUser` resolves the token to a user on every request. `requireUser` answers 401 without a user, and `requireAdmin` answers 403 for a non-admin.
- Changing your own password logs out your other sessions. An admin password reset logs out every session of that user.
- Guardrails: the default admin's name and email are locked, you cannot delete yourself, and the last admin cannot be deleted.

### Step progress

Each student has one `StepProgress` row per step of a workshop, created the first time they open it. A row moves through these statuses:

```
locked ──► available ──► done
               │           ▲
               ▼           │ host approves
         pending_review ───┘      (checkpoints only)
```

- The first step starts `available`, the others `locked`.
- Finishing a step marks it `done` and makes the next one `available`.
- On a checkpoint, submitting moves the step to `pending_review` until the host approves it.
- "Needs help" is a separate flag (`helpRequested`) that the student toggles and the host resolves.

The rules live in `src/progress/stateMachine.js`, and services go through it before writing progress.

### Live sessions and history

- Launching a workshop makes it the **only** active one: any other live workshop is deactivated. It gets a random join code and a `WorkshopRun` row.
- Joining creates a `Participation`. Joining a new run of a workshop starts that student's progress over.
- Every student action (joined, help requested, checkpoint submitted, step done, ...) is appended to `SessionEvent`. The live timeline and activity feed are built from this log.
- Ending a session closes the run. The history pages summarize each run from its events and feedback.
- There is no push channel: the live pages poll the API every 4 seconds.

### Errors

Responses for errors are JSON with an `error` field. Account endpoints use the structured shape `{ "error": { "code": "EMAIL_TAKEN", "message": "..." } }`. Older endpoints still send `{ "error": "message" }`. `api.js` handles both and throws an `Error` carrying the message.

## Data model

Defined in `backend/prisma/schema.prisma`.

| Model | Holds |
|---|---|
| `User` | Admins and students: name, email, role, password hash, accent color. |
| `Session` | Login sessions (hashed bearer tokens). |
| `Workshop` | Title, description, icon, and live state (`isActive`, `joinCode`, `launchedAt`). |
| `Step` | Ordered steps of a workshop; checkpoint flag and optional question (`text`, `multiple_choice`, `confirm`). |
| `Participation` | A student who joined a workshop. |
| `StepProgress` | A student's status on a step, submitted answer, help flag. |
| `SessionEvent` | Append-only log of what happened during live sessions. |
| `WorkshopRun` | One launch of a workshop, from `launchedAt` to `endedAt`. |
| `Feedback` | A student's 1–5 rating and comment for a run. |

## API overview

Every route is under `/api`. "Admin" means `requireAdmin`; "User" means any logged-in account.

| Area | Endpoints | Access |
|---|---|---|
| Auth | `POST /auth/lookup`, `/auth/login`, `/auth/signup` | Public |
| Auth | `POST /auth/logout` | User |
| My account | `GET/PATCH /me`, `PATCH /me/appearance`, `POST /me/password` | User |
| Accounts | `GET/POST /accounts`, `POST /accounts/:id/password`, `DELETE /accounts/:id` | Admin |
| Workshops | `GET /workshops` | User |
| Workshops | `POST /workshops`, `PATCH/DELETE /workshops/:id` | Admin |
| Steps | `POST /workshops/:workshopId/steps`, `PATCH/DELETE /steps/:id` | Admin |
| Live session | `GET /session`, `/session/progress`, `/session/events`, `POST /workshops/:id/launch`, `/workshops/:id/end` | Admin |
| Joining | `GET /join/:code`, `POST /join` | User (students only, checked in `sessions/`) |
| Student progress | `GET /me/workshops`, `/me/workshops/:id`, `/me/workshops/:id/recap`, `POST /steps/:id/submit`, `/steps/:id/help` | User |
| Feedback | `GET/POST /me/workshops/:id/feedback` | User |
| Review | `POST /steps/:id/unlock`, `/steps/:id/resolve-help`, `GET /workshops/:id/progress`, `/admin/feed` | Admin |
| History | `GET /runs`, `/runs/:id` | Admin |

The route files in `backend/src/routes/` are the reference for exact payloads.

## Frontend

- **Routing** is declared once in `App.jsx`. Logged-out users only reach `/login`. Admins and students get different route sets, plus the shared `/account` page and a 404 page.
- **Data** goes through `api.js` only. It adds the bearer token, parses JSON, and throws on non-2xx responses. A 401 while logged in clears the session and sends the user back to `/login`.
- **State** is local to pages (`useState`), with no global store. Every page that fetches handles loading, error and empty states.
- **Theme**: the tokens in `src/index.css` (`brutal-*` colors, hard shadows, square corners, Anton for headings, IBM Plex Sans for text) are redefined under `.dark`. `lib/theme.js` toggles the `dark` class on `<html>` and remembers the choice. Use the tokens and the `components/ui/` primitives rather than raw colors or new UI libraries.
- Students' progress pages poll every 4 seconds, like the admin live view.

## Database tasks

All from `backend/`:

| Task | Command |
|---|---|
| Apply existing migrations | `pnpm exec prisma migrate deploy` |
| Change the schema | edit `schema.prisma`, then `pnpm exec prisma migrate dev --name <short_description>` |
| Browse the data | `pnpm exec prisma studio` |
| Reset to demo data | `pnpm seed` (wipes everything first) |

Schema changes go through a migration, committed with the code that needs it.

## CI and code quality

`.github/workflows/sonar.yml` runs on every pull request and on pushes to `main`:

1. installs the backend and runs `pnpm test --coverage`;
2. sends the code and the coverage report to SonarQube.

It needs the `SONAR_TOKEN` and `SONAR_HOST_URL` repository secrets. `sonar-project.properties` excludes the frontend, routes and Prisma wiring from coverage, since only the backend logic and middleware are unit tested.

## Git workflow

- Branch from `main` (`feat/...`, `fix/...`, `chore/...`) and open a pull request. Keep one concern per PR.
- Commit messages follow Conventional Commits: `<type>(<scope>): <summary>` with types `feat`, `fix`, `refactor`, `test`, `docs`, `chore` and scopes `backend`, `frontend`, `db`, `progress`.
- Run `pnpm test` (backend) and `pnpm build` (frontend) before pushing.
- Never commit `.env`, database files, `coverage/` or build output.
