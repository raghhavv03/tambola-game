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

## Not started

- No UI wired to the engine yet — `App.tsx` is still the Vite template
- No theme-pack loader (themes/mythology.json exists but nothing reads it)
- No `/t` player ticket route (THE AIRGAP requires this stay fetch/socket-free)
- No room/called-numbers board screen
- No claim-verification UI (engine function exists, no host-facing trigger)
- No persistence of a game (seed/history) beyond in-memory state

## Known decisions worth knowing before continuing

- `generateSet` guarantees distinct tickets only, not the traditional 6-ticket set
  that partitions 1–90 exactly. If a session needs that, it's a new function, not a
  tweak to this one.
- Caller and ticket engines share `rng.ts` on purpose — don't reintroduce a second
  PRNG copy.
- Tests use fixed seeds for reproducibility; if a test fails, the seed in the
  failure message is the reproduction case — don't just re-run and hope.

## Suggested next-session prompt

> Read CLAUDE.md and PROGRESS.md first. Next: [describe the next phase — e.g. "wire
> the caller engine to a host-facing screen: big number display, draw/undo buttons,
> called-numbers board, theme phrase from themes/mythology.json"].
