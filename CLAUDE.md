# Tambola Host

## What this is

A themed number-caller for a **human host** running a **physical** tambola (housie)
game. The host taps to draw a number 1–90; the app shows it big and gives the host a
themed phrase to say out loud. Players mark their own tickets — paper, or on their own
phone via `/t`. The matching happens in the player's head. It's a prop for the host,
not a game platform.

Theme packs (see `THEME_PACK_GUIDE.md` and `themes/mythology.json`) are the actual
product; the app is a renderer over them.

## Non-negotiables

- never auto-mark a player's ticket
- never highlight/hint at a called number on a player's ticket
- never tell a player they missed one — if they miss it, they miss it, and the app
  says nothing
- never auto-call by default
- never add wallets/coins/prizes/pooling (real-money gaming is illegal in India under
  the PROG Act 2025)
- never use third-party IP
- themes are DATA not code
- no backend/auth/database

**THE AIRGAP.** The player ticket route (`/t`) must never have any channel to the
caller — no socket, no poll, no fetch, no shared store. It gets its ticket from the URL
and learns nothing else, ever. The room screen showing a called-numbers board is
CORRECT and traditional; the player's own ticket cross-referencing it is FATAL. The
line is not what the app displays — it is **WHO DOES THE MATCHING**, and that stays in
the player's head. This is structural, not a preference — if a task seems to require a
channel to `/t`, stop and say so.

If a requested feature violates any of these, say so and stop — don't build a
"configurable" version of it either.

## Stack

- Vite 8 + React 19 + TypeScript
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (no tailwind.config — v4 configures
  in CSS; entry is `@import 'tailwindcss'` in `src/index.css`)
- zustand for state, motion (framer-motion successor) for animation
- Vitest for tests (`npm test`), config in `vitest.config.ts`, node environment
- No backend. Everything is local, static, offline-capable.

Themes load from `themes/*.json`. Renderer must stay theme-agnostic: adding a theme
must never require a component change. If it does, the schema is broken — fix the
schema.

The app has TWO entry points, dynamically imported in `src/main.tsx`: the host screen
(`src/App.tsx`) and the player ticket (`src/player/PlayerApp.tsx`, route `/t`). They
are separate bundles with separate module graphs on purpose — that split is how THE
AIRGAP is enforced structurally rather than by good intentions.
`src/player/airgap.test.ts` walks the player's import graph and fails the build if it
can reach the caller, the store, or any network API. If a change makes that test fail,
the change is wrong, not the test.

Game logic lives in `src/engine/` — pure TypeScript, no React, no app imports, no
network/storage. `caller.ts` (number draw order) and `ticket.ts` (ticket generation +
claim verification) share one seeded PRNG (`rng.ts`). See PROGRESS.md for what's built
and what's next.

## Working with me

I'm new to this stack. So:

- Comment non-obvious lines — assume I'll read the code to learn from it.
- Prefer boring, readable code over clever code. No dense one-liners, no premature
  abstraction.
- When I ask for something that's a bad idea, tell me directly and say why. Don't
  quietly build it anyway.
