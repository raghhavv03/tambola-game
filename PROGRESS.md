# Progress

Read alongside `CLAUDE.md` (rules/non-negotiables) at the start of any new session.
This file is state, not rules — update it at the end of each phase.

## Done

**Phase 0 — scaffold**
- Vite 8 + React 19 + TS repo, Tailwind v4 wired via `@tailwindcss/vite` (no config
  file, `@import 'tailwindcss'` in `src/index.css`)
- `CLAUDE.md` written: project framing, non-negotiables, THE AIRGAP rule

**Phase 1 — engine (pure TS, no React, no app imports)**
- `src/engine/rng.ts` — seeded PRNG (mulberry32), shared by caller + ticket
- `src/engine/caller.ts` — `createCaller(seed?)`: seeded Fisher-Yates shuffle of
  1–90, `draw()` / `undo()` / `reset()` / `history` / `remaining` / `called`
- `src/engine/ticket.ts` — `generateTicket(seed)`, `generateSet(n, seed)` (distinct
  tickets, NOT the "book of 6" property — flagged, not built),
  `verifyClaim(ticket, calledNumbers, dividend)` for the 6 standard dividends
- Vitest installed + configured (`vitest.config.ts`, node environment, `npm test`)
- 19 tests passing: 6 caller, 13 ticket (incl. 1000-seed constraint sweep)
- `npm run build` clean (typecheck + vite build)

**Phase 2 — host screen**
- `src/store/gameStore.ts` — zustand store wrapping one module-level `Caller`;
  mirrors `history`/`called`/`currentNumber`/`lastDrawnAt` after every action,
  never duplicates draw-order logic itself
- `src/types/theme.ts` — `ThemePack` type matching `themes/*.json` shape
- `src/components/`: `NumberDisplay`, `DrawButton`, `UndoButton`, `NumberGrid`,
  `PaceIndicator` — each a single-purpose, theme-agnostic component
- `App.tsx` rewritten: mobile-first flex-column layout, giant number (clamp-sized,
  legible from 3m in both portrait and landscape), phrase from
  `themes/mythology.json` read directly, DRAW pinned bottom third, Undo in the
  opposite corner, 1-90 called-numbers grid, pace indicator (plain text nudge,
  fades in 10s after last draw — no timer/autoplay, never calls draw() itself)
- `tsconfig.app.json`: added `resolveJsonModule` so theme JSON imports type-check
- `.claude/launch.json` added for `npm run dev` preview
- Verified in-browser at mobile (375x812) and landscape (812x375): number/phrase/
  grid/button all fit without clipping or overlap at both

## Not started

- No `/t` player ticket route (THE AIRGAP requires this stay fetch/socket-free)
- No room/called-numbers board screen (separate from the host's own view)
- No claim-verification UI (engine function exists, no host-facing trigger)
- No persistence of a game (seed/history) beyond in-memory state
- No animation player — theme's `anim` keys are unused; phrase text only

## Known decisions worth knowing before continuing

- `generateSet` guarantees distinct tickets only, not the traditional 6-ticket set
  that partitions 1–90 exactly. If a session needs that, it's a new function, not a
  tweak to this one.
- Caller and ticket engines share `rng.ts` on purpose — don't reintroduce a second
  PRNG copy.
- Tests use fixed seeds for reproducibility; if a test fails, the seed in the
  failure message is the reproduction case — don't just re-run and hope.

## Suggested next-session prompt

> Read CLAUDE.md and PROGRESS.md first. Next: [describe the next phase — e.g. "build
> the /t player ticket route: renders one ticket from a seed in the URL, THE AIRGAP
> applies — no fetch/socket/shared store with the host screen" or "add claim
> verification UI on the host screen using the existing verifyClaim() engine fn"].
