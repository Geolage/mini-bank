## What and why

<!-- One paragraph: the problem this solves and the approach taken. -->

## Related issue

<!-- Closes #… / n/a -->

## How it was verified

- [ ] `pnpm lint && pnpm format:check && pnpm typecheck`
- [ ] `pnpm test` and `pnpm --filter api test:e2e`
- [ ] `pnpm build && pnpm --filter web size` (budget 400 kB gzip)
- [ ] `pnpm --filter web cy:run` (if UI flows changed)
- [ ] axe / Lighthouse Accessibility still 100 (if UI changed)
- [ ] New strings added to **both** locale catalogues (if copy changed)

## Screenshots / clips

<!-- Required for UI changes. -->

## Notes for reviewers

<!-- Trade-offs, follow-ups, anything deliberately left out. -->
