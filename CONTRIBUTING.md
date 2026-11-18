# Contributing to MiniBank

Thanks for helping improve this demo. It is a full-stack banking console built to be read
and studied, so **clarity and reproducibility beat cleverness**: every change should
keep the app runnable, the gates green, and the reasoning visible in the commit message.

## Setup

```bash
pnpm install          # also installs the git hooks (lefthook)
cp api/.env.example api/.env
pnpm db:up            # Docker PostgreSQL, or point DATABASE_URL at a local instance
pnpm db:migrate
pnpm db:seed
pnpm dev              # web on http://localhost:8080, API on http://localhost:3000
```

Node 24 (`.nvmrc`), pnpm 12 (pinned via `packageManager`). Demo sign-ins: `admin` /
`11111111` (operator) and `visitor` / `00000000` (viewer).

If a demo run moved money and you want the seeded balances back:

```bash
pnpm --filter api exec prisma migrate reset --force
```

## Daily commands

| Command                                 | What it checks                                              |
| --------------------------------------- | ----------------------------------------------------------- |
| `pnpm lint`                             | oxlint (type-aware in `api`)                                |
| `pnpm format:check` / `pnpm format`     | Prettier, repo-wide config with per-package overrides       |
| `pnpm typecheck`                        | `tsc` in both packages                                      |
| `pnpm test`                             | Vitest unit suites (web includes axe accessibility checks)  |
| `pnpm --filter api test:e2e`            | Supertest endpoint suites (mocked Prisma, no DB needed)     |
| `pnpm build` + `pnpm --filter web size` | production build and the 400 kB gzip initial-payload budget |
| `pnpm --filter web cy:run`              | Cypress against running web + API + DB (local only)         |

## Branches and commits

- Branch from `main`; name branches `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/); the
  `commit-msg` hook rejects anything else. Allowed types: `feat`, `fix`, `docs`, `style`,
  `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Explain **why** in the body, not just what. One logical change per commit.
- The `pre-commit` hook formats staged files with Prettier and re-stages them, so never
  fight the formatter by hand.

## Pull requests

- Fill in the template; link the issue when there is one.
- Before requesting review: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test
&& pnpm --filter api test:e2e && pnpm build && pnpm --filter web size`, plus
  `pnpm --filter web cy:run` if you touched UI flows.
- UI changes need a screenshot or a short clip in the PR description, and must keep
  Lighthouse Accessibility at 100 (`pnpm --filter web test` runs axe over every page).
- New user-facing strings go into **both** `web/src/i18n/locales/en-US.ts` and
  `zh-CN.ts`; the completeness test fails on a missing key.
- New colours must pass the contrast assertions in `web/src/theme/presets.test.ts`
  (white-on-primary, link-on-white, sidebar selection — all ≥ 4.5:1).
- Money stays a decimal string end to end; aggregate in integer cents, never floats, and
  never sum across currencies.

## What CI enforces

`lint`, `format:check`, `typecheck`, unit tests, API e2e, `build`, and the bundle budget on
every push to `main` and every pull request. Cypress and Lighthouse are run locally because
they need browsers and running servers; say so in the PR if you skipped them.

## Reporting problems

Use the issue templates. Security issues: see [SECURITY.md](SECURITY.md) — do not open a
public issue for those.
