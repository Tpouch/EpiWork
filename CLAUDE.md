# CLAUDE.md

Guidance for Claude Code when working in this repository. Read it fully before any task.
If an instruction here conflicts with a direct request from the user, ask before acting.

## 1. Project context

This is a **proof of concept (POC)**. Optimize for clarity, speed of iteration, and easy
replacement of parts later. Do not optimize for scale, multi-tenancy, or production hardening
unless explicitly asked.

### Stack

- **Package manager**: pnpm
- **Backend**: Node.js + Express, Prisma ORM, SQLite
- **Frontend**: React + Vite, Tailwind CSS v4 + shadcn/ui on Base UI (neo-brutalist
  "brutal" theme, light/dark), lucide-react icons, react-router-dom
- **Tests**: Jest on the backend only (progress state machine + middleware unit tests).
  No automated frontend or E2E tests: the frontend is verified by manual click-through.

### Package manager: pnpm only

- Always use `pnpm`. Never run `npm` or `yarn` commands, even in suggestions.
- Never create `package-lock.json` or `yarn.lock`. `pnpm-lock.yaml` is the only lockfile.
- Use `pnpm <script>` for scripts, `pnpm exec <bin>` for local binaries,
  `pnpm dlx <pkg>` for one-off tools.

### Commands

<!-- ADJUST: replace with the real scripts from package.json -->

```bash
# Backend (from /backend)
pnpm install
pnpm exec prisma migrate dev   # apply schema changes + regenerate client
pnpm exec prisma studio        # inspect the SQLite database
pnpm dev                       # start the API
pnpm test                      # run Jest

# Frontend (from /frontend)
pnpm install
pnpm dev                       # start Vite
pnpm build                     # compile check + production build
```

### Repository layout

<!-- ADJUST: keep in sync with the real tree -->

```
backend/
  prisma/schema.prisma      # single source of truth for the data model
  src/
    app.js                  # Express app setup (middleware + routes), no listen()
    server.js               # calls app.listen()
    db.js                   # single PrismaClient instance
    middleware/             # cross-cutting concerns, error handler
    routes/                 # HTTP layer: parse request, call service, send response
    services/               # business logic, the only layer that uses Prisma
    domain/                 # pure logic with no I/O (e.g. progress state machine)
  tests/
frontend/
  src/
    main.jsx                # Router + global CSS import
    index.css               # Tailwind + brutal theme tokens (light and .dark)
    api/                    # the ONLY place that calls fetch
    pages/                  # one component per route
    components/             # reusable UI pieces
```

## 2. Engineering principles

### KISS comes first

- Write the simplest code that correctly solves the current requirement.
- No speculative features, no "we might need it later" abstractions (YAGNI).
- Prefer plain functions and plain objects over classes.
- Prefer the standard library, Express, Prisma, Tailwind and the existing `components/ui` built-ins over new dependencies.
- A little duplication is cheaper than the wrong abstraction. Extract a helper at the
  **third** repetition, not the first.
- Short functions, early returns, flat control flow. Avoid nesting deeper than 2 or 3 levels.
- Names must explain intent. If a comment is needed to explain *what* code does, rename or
  simplify instead. Comments explain *why*.

### SOLID, applied pragmatically

SOLID is used here to keep modules small and replaceable, not to build enterprise layers.

- **S: Single Responsibility.** Each module has one reason to change.
  Routes handle HTTP, services handle business rules, `domain/` holds pure logic,
  `db.js` owns the Prisma client, `api/` owns network calls on the frontend.
- **O: Open/Closed.** Extend by adding data, not by editing branches. Example: the progress
  state machine is driven by a transitions table; adding a state means adding table entries,
  not new `if` chains.
- **L: Liskov Substitution.** Any replacement for a module must honor the same contract:
  same inputs, same outputs, same errors.
- **I: Interface Segregation.** Functions take only what they need. Pass ids and values, not
  the whole `req`. Components receive only the props they use.
- **D: Dependency Inversion.** High-level logic does not know about Express or HTTP. Services
  receive plain arguments. When a test needs to swap a dependency, pass it as a function
  parameter or module argument. No DI container, no framework.

### When KISS and SOLID disagree

**KISS wins.** Concretely, do NOT:

- create an interface, base class or factory for something that has a single implementation;
- add a repository layer on top of Prisma (Prisma already is the data access layer);
- split a 40 line file into 4 files "for separation of concerns";
- add design patterns the current code does not need.

If you believe an abstraction is justified, state the concrete problem it solves and ask first.

## 3. How to work

1. **Explore before editing.** Read the files involved and their callers. Do not guess APIs.
2. **Plan non trivial changes.** For anything touching more than 2 or 3 files or the Prisma
   schema, write a short plan and wait for approval.
3. **Small, focused diffs.** One concern per change. Do not reformat or refactor unrelated code.
4. **Verify.** Run `pnpm test` after backend changes. Run `pnpm build` after frontend
   changes. Report what you ran and the result. Never claim something works without checking.
5. **Ask when unsure.** A question is cheaper than a wrong assumption on business rules.
6. **Stay in scope.** If you notice an unrelated problem, mention it at the end, do not fix it.

### Never without explicit permission

- Add, remove or upgrade a dependency.
- Change the Prisma schema or create a migration.
- Delete files, or change project configuration (Vite, Jest, ESLint, package.json scripts).
- Commit, push, rebase, reset, or rewrite git history.
- Touch `.env` files or print secrets.

## 4. Backend conventions

### Layering

```
request -> middleware -> route -> service -> Prisma -> SQLite
                                     |
                                  domain/ (pure logic)
```

- **Routes**: validate and parse input, call one service function, map the result to a
  status code and JSON. No Prisma calls, no business rules in routes.
- **Services**: business rules and database access. Receive plain values (ids, validated
  payloads). Never receive `req` or `res`.
- **Domain**: pure functions, no I/O, no Prisma, no Express. Fully unit testable.

### Prisma and SQLite

- Import the client only from `src/db.js`. Never instantiate `new PrismaClient()` elsewhere.
- `schema.prisma` is the source of truth for models. After editing it (with permission),
  run `pnpm exec prisma migrate dev --name <short_description>`.
- Select only the fields you need (`select`) when returning data to the client.
- Use `prisma.$transaction` when several writes must succeed or fail together.
- SQLite has limits (type support, concurrency). If a Prisma feature is not supported on
  SQLite in the installed version, store the value in a simple type and validate in code
  rather than switching databases.

### Progress state machine

- Lives in `src/domain/`, as pure functions.
- The allowed transitions are declared in a single table (object or map). That table is the
  single source of truth: no transition logic duplicated in routes, services or frontend.
- Expose a small API, e.g. `canTransition(from, to)` and `transition(from, to)` which returns
  the new state or throws a named error for an invalid transition.
- Services call the state machine **before** writing to the database.
- Any change to states or transitions requires updating the unit tests in the same change.

### Errors and responses

- One central Express error handler. Services throw errors with a status or a known name;
  the handler maps them to HTTP responses. No scattered `try/catch` that re-sends responses.
- Consistent error shape: `{ "error": { "code": "SOME_CODE", "message": "Human readable" } }`.
- Status codes: `400` invalid input, `404` not found, `409` invalid state transition or
  conflict, `500` unexpected.
- Never leak stack traces or Prisma internals in responses.
- Validate input at the route boundary. Keep validation simple and explicit; do not add a
  validation library unless asked.

### Style

- `async/await` only, no raw promise chains, no callbacks.
- No unused code, no commented out code, no `console.log` left behind (except intentional
  startup logs).
- Keep `app.js` free of `listen()` so tests can import the app without starting a server.

## 5. Frontend conventions

### Brutal theme (Tailwind v4 + shadcn/ui)

- Style with Tailwind utility classes. Combine conditional classes with `cn()` from
  `@/lib/utils`. No CSS modules, no inline hex colors.
- The theme lives in `src/index.css` (`@theme` block): `brutal-*` color tokens
  (`bg`, `surface`, `field`, `ink`, `line`, `dark`, `accent`, `orange`, `cyan`, `green`,
  `pink`, `red`), `shadow-brutal-*`, square corners, and the Anton (headings, uppercase)
  and IBM Plex Sans fonts. Use these tokens; do not hardcode colors.
- Dark theme: `lib/theme.js` toggles the `dark` class on `<html>` and `.dark` in
  `index.css` redefines the tokens. Any new token must work in both themes.
  `brutal-dark` never flips: use it for text on colored surfaces.
- Signal colors for progress (help, review, done) are in `src/theme.js`; reuse them.
- Prefer the shadcn primitives in `components/ui/` (`Button`, `Card`, `Badge`, `Input`,
  `Select`, `Tooltip`, etc., built on `@base-ui/react`) and the app's own `Modal`
  over custom markup. Icons come from `lucide-react`.
- Do not add another UI or styling library.

### Structure

- **Pages** (`pages/`): one per route, fetch data and compose components.
- **Components** (`components/`): presentational, receive data and callbacks through props.
- **API layer** (`api/`): the only place that calls `fetch`. It sets common headers,
  parses JSON, and throws on non 2xx responses with the backend error message.
  Components never build URLs or headers themselves.
- Routing is declared in one place with react-router-dom.

### State and data

- Start with local state (`useState`, `useReducer`). Lift state only when two components
  truly need it. No global state library unless asked.
- Every data fetching screen handles three states: **loading**, **error**, **empty/success**.
- The frontend never re-implements the progress state machine. It displays what the backend
  allows and shows the backend error when a transition is refused.

### Style

- Function components and hooks only.
- Keep components under ~150 lines; split when a component does more than one job.
- Derive values instead of storing duplicated state.

## 6. Testing

### Backend (Jest)

- Required coverage for this POC:
  - **Progress state machine**: every valid transition, a representative set of invalid
    transitions, and unknown states.
  - **Middleware**: each branch of each middleware (rejects, passes through, sets expected
    values on `req`).
- Test pure functions directly. For middleware, pass mock `req`, `res`, `next` objects and
  stub external lookups; no real database or server in unit tests.
- One behavior per test, descriptive names: `it('rejects transition from DONE to TODO')`.
- When fixing a bug in tested code, first add a failing test that reproduces it.
- Do not add integration, E2E or frontend test frameworks unless explicitly asked.

### Frontend (manual)

There are no automated frontend tests. After a frontend change, list in your summary the
manual click-through the user should perform, for example:

- perform the changed flow end to end;
- check loading, error and empty states;
- check an invalid action shows the backend error;
- reload the page and check the data persisted.

## 7. Git and commits

### Attribution: strictly forbidden

- **Never** add `Co-Authored-By:` trailers of any kind to commit messages.
- **Never** add "Generated with Claude Code", a Claude/Anthropic signature, a session link,
  a `Claude-Session:` trailer, or emojis referring to AI in commits or pull requests.
- Commit messages contain only the human readable description of the change.
- The same rule applies to PR titles and descriptions.

### Commit rules

- Only commit when the user asks. Never push unless asked.
- Never use `--no-verify`, never force push, never amend or rebase published commits.
- Do not commit secrets, `.env`, the SQLite database file, or build outputs.
- One logical change per commit.
- Message format (Conventional Commits):

```
<type>(<scope>): <short imperative summary, max 72 chars>

<optional body: what and why, not how>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
Scopes: `backend`, `frontend`, `db`, `progress`.

Example:

```
fix(progress): reject transition from DONE back to TODO

The state machine table allowed it, which let users reset finished items.
```

## 8. Definition of done

A task is done when:

- the change does what was asked, and nothing more;
- the code follows KISS first, SOLID pragmatically (section 2);
- `pnpm test` passes for any backend change, and new logic in `domain/` or `middleware/` has tests;
- `pnpm build` passes for any frontend change, and a manual test checklist is provided;
- no debug logs, dead code, or unrelated edits remain;
- your final summary lists: files changed, commands run and their results, assumptions made,
  and any issue noticed but left out of scope.
