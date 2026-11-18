# MiniBank · Account Console

A full-stack banking demo. It covers authentication, account balances, money transfers, audit trails, accessibility and CI-ready testing.

> Status: authentication, accounts, transaction history, transfers and audit logs are implemented end to end, on the final frontend stack. Remaining work is deployment and stretch goals (see [Build tasks](#build-tasks)).
>
> The frontend runs on React Router + TanStack Query + Zustand + Ant Design/ProComponents.

## Architecture

```
React SPA (web)  ──/api──▶  NestJS API (api)  ──▶  PostgreSQL
Vite · TanStack Query       JWT · RBAC · Swagger      Prisma · migrations
                                   │
                                   └──▶ Pino structured logs
```

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite 8 |
| Routing | React Router 7 |
| Server state | TanStack Query 5 |
| Session state | Zustand 5 |
| Forms | Ant Design Form |
| UI | Ant Design 5 + ProComponents (ProLayout, ProCard, ProTable) |
| Frontend tests | Vitest 5 + React Testing Library + jest-dom (Jest-compatible API) |
| E2E | Cypress 16 |
| Backend | NestJS 12 (ESM), Passport JWT |
| Database | PostgreSQL 16 + Prisma 6 |
| API docs | Swagger / OpenAPI |
| Logging | Pino (nestjs-pino) |
| CI | GitHub Actions |

## Repository layout

```
mini-bank/
├── web/                     # React SPA
│   ├── src/app/             # providers, auth store, query client
│   ├── src/services/        # typed fetch client + query options
│   ├── src/pages/           # route-level pages
│   └── cypress/             # E2E specs
├── api/                     # NestJS API
│   ├── src/auth/            # login, JWT strategy, guards
│   ├── src/accounts/        # accounts read model
│   ├── src/transactions/    # paginated transaction history API
│   ├── src/transfers/       # transfer + idempotency
│   ├── src/audit/           # audit log query
│   └── prisma/              # schema, migration, seed
├── docker-compose.yml       # PostgreSQL for local development
└── .github/workflows/ci.yml
```

## Quick start

### Prerequisites

- Node.js 20+ (tested with Node 24)
- pnpm 12 (`corepack enable pnpm`; the repo pins `packageManager: pnpm@12.16.1`)
- Docker Desktop **or** a local PostgreSQL 16 instance

### 1. Install

```bash
pnpm install
```

### 2. Configure the API

```bash
# macOS / Linux
cp api/.env.example api/.env

# Windows (PowerShell)
Copy-Item api/.env.example api/.env
```

### 3. Start PostgreSQL

Option A — Docker (recommended):

```bash
pnpm db:up
```

Option B — local PostgreSQL:

```sql
CREATE USER minibank WITH PASSWORD 'minibank' CREATEDB;
CREATE DATABASE minibank OWNER minibank;
```

Make sure `DATABASE_URL` in `api/.env` matches your instance.

### 4. Apply the schema and seed demo data

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Run

```bash
pnpm dev
```

| Service | URL |
|---|---|
| Web app | http://localhost:5173 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/docs |
| Health | http://localhost:3000/api/health |

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Operator (can transfer) | `operator@minibank.dev` | `Password123!` |
| Viewer (read only) | `viewer@minibank.dev` | `Password123!` |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run web + API in watch mode |
| `pnpm build` | Build both apps |
| `pnpm --filter web size` | Check the initial gzipped payload against the 400 kB budget |
| `pnpm lint` | Oxlint both apps |
| `pnpm typecheck` | TypeScript checks |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm --filter api test:e2e` | API e2e tests (no DB required) |
| `pnpm db:up` / `db:down` | Start / stop PostgreSQL |
| `pnpm db:migrate` | `prisma migrate dev` (also generates the Prisma client) |
| `pnpm db:generate` | Generate the Prisma client without migrating (used by CI) |
| `pnpm db:seed` | Seed demo users, accounts and transactions |
| `pnpm db:studio` | Prisma Studio |
| `pnpm --filter web cy:open` | Cypress interactive runner |
| `pnpm --filter web cy:run` | Cypress headless (requires web + API + DB) |

## Build tasks

The core flows are implemented. The remaining tasks are stack cleanup, test depth,
accessibility and stretch goals.

### 1. Transaction history (implemented)

- API: `GET /api/accounts/:accountId/transactions`
- Pagination (`page`, `pageSize`), filters (`from`, `to`, `type=INCOMING|OUTGOING`)
- Owner check, stable ordering, empty page handling
- UI: ProTable with URL-synced pagination, direction and date filters
- Tests: service unit + Supertest e2e, URL-state/component tests, Cypress flow

### 2. Transfer (implemented)

- API: `POST /api/transfers` (operator only, `Idempotency-Key` header required)
- One database transaction: debit, credit, transaction row, audit log
- Row locks with `SELECT ... FOR UPDATE` in deterministic id order
- Rejects insufficient funds, same-account and currency mismatch with clear 4xx errors
- Repeating the same idempotency key returns the original result
- UI: Ant Design Form + TanStack mutation; success invalidates accounts, transactions
  and audit queries

### 3. Audit log (implemented)

- API: `GET /api/audit-logs` (operator only) with pagination and actor/action/date filters
- UI: ProTable with URL-synced filters and pagination
- Tests: RBAC (viewer gets 403) and transfer-created entries

### 4. Test depth (in progress)

- Done: Vitest for the auth store, guards and every page state; axe-core checks for all
  pages; Supertest e2e for transactions, transfers and audit; Cypress for login, shell,
  transactions, audit and the transfer UI
- Remaining: a Cypress transfer scenario against the real database with automatic
  demo-data reset

### 5. Accessibility (implemented)

- Done: axe-core in Vitest (wcag2a/wcag2aa/best-practice, failing on critical and
  serious findings), skip-link tab order, `aria-invalid` / `aria-describedby` wiring and
  loading announcements
- Done: Lighthouse on the production build — Accessibility 100, Best Practices 100 and
  SEO 100 on both form factors (mobile Performance 84 under simulated slow 4G, desktop
  99). The audit caught contrast failures jsdom cannot see, so the theme overrides
  `colorPrimary` and `colorTextDescription` with AA-passing values
- Remaining: dialogs and the ProLayout mobile drawer in a real browser

### 6. Stretch goals

- Refresh tokens / httpOnly cookies
- Redis caching for account summaries
- Keyset pagination for deep pages
- Deploy: Vercel (web) + Render (API) + Neon (PostgreSQL)

## Design decisions worth knowing

- **Money is a decimal string, never a float.** Prisma `Decimal(14, 2)` end to end.
- **TanStack Query with a hand-written fetch client.** One `apiFetch` owns the JWT, error
  parsing and 401 sign-out; query keys and prefix invalidation keep balances, statements
  and the audit log coherent after a transfer.
- **Idempotency key + DB transaction + row locks.** Built for retries and concurrent transfers.
- **RBAC enforced in the API, mirrored in the UI.** UI hiding is never the security boundary.
- **Vitest instead of Jest.** Jest-compatible API with native Vite integration; Cypress covers E2E.

## Known limitations

- JWT is stored in `localStorage` for demo simplicity. Production should use httpOnly, secure cookies with CSRF protection.
- No refresh token, rate limiting or account lockout.
- Seed data only; no real banking integration.
- The API runs without HTTPS locally.

## Accessibility

- Skip link, landmarks, semantic headings
- Labelled form controls with `aria-invalid` / `aria-describedby`
- Visible focus rings and `prefers-reduced-motion` support
- Alerts announced via `role="alert"` / `role="status"`
- `pnpm --filter web test` runs axe-core over every page and fails on critical or
  serious violations
- Lighthouse Accessibility scores 100 on the production build (mobile and desktop)

## License

MIT — see [LICENSE](LICENSE). The demo data is synthetic; no real bank or personal data.
