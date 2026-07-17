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

**Phase 3 — theme system**
- `src/themes/types.ts` — `Theme` type mirroring THEME_PACK_GUIDE.md §7 exactly;
  `note`/`mech` typed optional and documented BUILD-TIME ONLY (app never reads
  them — plain.json omits them entirely, proving nothing depends on them)
- `src/themes/loader.ts` — `validateTheme()`: all 90 call keys, all 6 milestones,
  every `anim` (calls + milestones) must resolve in the theme's own `animations`
  map, intensity 1-3. Collects ALL problems and throws ONE error listing them —
  a missing key is a crash at load, never a silent fallback
- `src/themes/index.ts` — registry via `import.meta.glob('../../themes/*.json',
  { eager: true })`: adding a pack = dropping a JSON file in `themes/`, zero code
  edits anywhere. Every pack validated eagerly at app startup
- `src/components/ThemePicker.tsx` — select in the header, renders whatever the
  registry loaded; switching mid-game swaps phrases only, never the draw order
- `themes/plain.json` — deliberately minimal second pack ("Number N." for all 90)
  proving the abstraction: adding it touched NO component code
- 10 loader tests (shipped packs as fixtures + one-field-at-a-time breakage);
  29 total passing. Old `src/types/theme.ts` deleted (superseded)

**Phase 4 — reaction layer**
- `src/anim/` — 16 animation components (one per mythology animations key:
  default, om, trishul, chakra, diya, conch, fire_ring, damru, lotus, bow,
  peacock, swan, stars, mountain, thali, aarti), all inline SVG + Motion,
  original abstract geometry only (no glyph tracing, no figures, no third-party
  imagery). `shared.ts` holds the one intensity table: 1 = 0.45s accent,
  2 = 0.8s flourish, 3 = 1.25s full-screen — every reaction fades itself out
  inside its budget (hard ceiling ~1.5s; the host talks over it)
- `src/anim/registry.ts` — key → component map. Theme `animations` values are
  now COMPONENT KEYS (not file paths, no Lottie); loader validates every value
  against the registry at startup, tests validate shipped packs against the
  real registry in CI
- `src/components/ReactionLayer.tsx` — fixed pointer-events-none overlay,
  keyed on `drawSeq` (store counter that only draw() bumps — undo never
  replays). `useReducedMotion` disables the whole layer
- `/?anim` — dev/QA preview harness (`AnimPreview.tsx`): replay any key at any
  intensity. Not a player surface; exists because sub-1.5s reactions can't be
  reviewed by drawing random numbers
- THEME_PACK_GUIDE.md §7 updated: animations values documented as registry keys

## Not started

- No `/t` player ticket route (THE AIRGAP requires this stay fetch/socket-free)
- No room/called-numbers board screen (separate from the host's own view)
- No claim-verification UI (engine function exists, no host-facing trigger)
- No persistence of a game (seed/history) beyond in-memory state
- No milestone reactions — `milestones` phrases/anims exist in packs and are
  validated, but nothing triggers them (needs the claim-verification UI first)

## Known decisions worth knowing before continuing

- `generateSet` guarantees distinct tickets only, not the traditional 6-ticket set
  that partitions 1–90 exactly. If a session needs that, it's a new function, not a
  tweak to this one.
- Caller and ticket engines share `rng.ts` on purpose — don't reintroduce a second
  PRNG copy.
- Tests use fixed seeds for reproducibility; if a test fails, the seed in the
  failure message is the reproduction case — don't just re-run and hope.
- New theme pack = drop a JSON file in `themes/`, nothing else. If a task ever
  seems to need touching a component to add a theme, the schema/loader is
  wrong — fix `src/themes/`, not the component. `note`/`mech` are build-time
  only; don't add app code that reads them.

## Suggested next-session prompt

> Read CLAUDE.md and PROGRESS.md first. Next: [describe the next phase — e.g. "build
> the /t player ticket route: renders one ticket from a seed in the URL, THE AIRGAP
> applies — no fetch/socket/shared store with the host screen" or "add claim
> verification UI on the host screen using the existing verifyClaim() engine fn"].
