# Progress

State, not rules. Read with `CLAUDE.md` (rules/airgap) and `RUNBOOK.md` (sequence).
Update at the end of each phase. Keep it terse — one line per thing, not prose.

## Done

- **P0 scaffold** — Vite 8 + React 19 + TS, Tailwind v4 (`@tailwindcss/vite`), CLAUDE.md.
- **P1 engine** (`src/engine/`, pure TS) — `rng.ts` (mulberry32), `caller.ts` (seeded
  Fisher-Yates 1–90, draw/undo/reset/history), `ticket.ts` (generate + `verifyClaim` for
  6 dividends), `ticketId.ts` (Crockford base32 "recipe" ID). Real tests.
- **P2 host screen** — `App.tsx` + `gameStore` (zustand over one Caller), components
  (NumberDisplay/DrawButton/UndoButton/NumberGrid/PaceIndicator). Manual draw only.
- **P3 theme system** — `themes/types.ts` + `loader.ts` (validates 90 calls + 6
  milestones, throws on any miss), registry via `import.meta.glob`, ThemePicker.
  `plain.json` proves adding a pack touches zero components.
- **P5 delivery** — `ticketLink.ts` (`/t#id`, id in fragment), QR (QrCode/TicketsPanel),
  `/t` player route (`PlayerApp`/`TicketCell`/`marks.ts`: tap-mark, localStorage),
  PrintSheet (A4 6-up), VerifierPanel + `claimStore` bogey counter. `main.tsx` splits
  host/player into two dynamic-import bundles. `airgap.test.ts` guards it.
- **P6/P7 room display** — `DisplayMode` (`?display=1`): giant number, board, keyboard
  draw/undo. Visual identity is data (`display` token block); contrast floors enforced
  at load. Reaction layer was built (P4) then removed — didn't earn its place.
- **P8 persistence + milestone** — `persist.ts` (`tambola:host:game`/`:bogeys`),
  `replayCaller`, `gameSession` orchestrator, `ResumeGamePrompt`. Milestone phrase shows
  in the verifier on a VALID ruling.
- **P9 PWA + wake lock + sound + settings** — `vite-plugin-pwa` injectManifest, owned
  precache-only `src/sw.ts` (airgap: `airgap.test.ts` asserts it relays nothing between
  clients). `useWakeLock` (host + display). `sound.ts` (recorded clip else Web Speech
  TTS) wired on draw via `useDrawWithSound`, off by default. `settingsStore`
  (`tambola:host:settings`) + `SettingsSheet` behind a header gear (theme picker moved
  in, TTS + reduce-motion). `vercel.json` SPA rewrite fixed the `/t` 404 on Vercel.
- **P10 themed host + home screen** (RUNBOOK Tasks 11+12) — `stageVariables` extracted
  from DisplayMode into `src/themes/stage.ts`; App root sets the same CSS variables, so
  the active theme's `display`/`accent` tokens paint the HOST screen too (number,
  phrase, board, DRAW button); packs without tokens get the neutral default, token by
  token. `HomeScreen` front door: theme pick (live repaint), Resume/Continue/Start,
  entries to Tickets / Room display (same-tab `?display=1&theme=`) / Settings. Home is
  the resume gate on the host path; `ResumeGamePrompt` still guards `?display=1` loads.
  Theme choice persisted (`themeId` in settingsStore, stale ids fall back to first
  pack) — pulled forward from Task 13. Header "New Game" dropped (home owns it).
- **P11 Task 13 + UI pass 1** — cast button on the caller header (same-tab
  `?display=1&theme=`), `GameOverCard` (trophy, New Game, no confirm — game finished).
  Visual redesign, all still token-painted: Fraunces (self-hosted `@fontsource`,
  offline-safe) as `font-display`; ambient accent glow on the App root
  (color-mix from `--board-called`); number hero card (overline, dashed accent ring,
  phrase pill, spring entrance); `RecentNumbers` 5-chip strip; board in a panel card;
  gradient+glow DRAW/CTA recipe; `ThemePicker` is now live-preview cards painted in
  each pack's own palette (`themeSwatch` in stage.ts); inline Lucide-path icon set
  (`components/icons.tsx`); icon header with 44px targets, labels fold away below
  `sm`.
- **P12 UI pass 2** — Tickets/Verifier/Settings panels moved onto stage tokens
  (border/panel/chrome/number/phrase), Fraunces headings, icon buttons; QR stays flat
  white/black (scanning requirement, never themed). Player `/t` got a cosmetic-only
  pass (rounder cells, ticket-card frame, `font-display` on chrome text) — no logic
  touched, no new import in its module graph, `airgap.test.ts` unmodified and passing.
  Room display number now also uses `font-display`.
- **P13 consistency pass** — one `btn-accent` CSS utility (index.css) is now THE
  primary-action look everywhere (DRAW, Start/Resume/Continue, New Game);
  `AMBIENT_BACKGROUND` shared const in stage.ts. ResumeGamePrompt moved onto stage
  tokens and wrapped in the display theme's variables on `?display=1` loads (was
  unthemed neutral+emerald). Room display gained an exit: "‹ Host" header button
  (stopPropagation so it can't draw) + Esc key, both navigating back to `/`.

## Not started

- **Capacitor Android wrap** (RUNBOOK Task 9) — repo side DONE: `@capacitor/*`
  installed, `capacitor.config.ts`, `android/` scaffolded, icons/splash generated from
  `assets/logo.png`. Remaining is user-machine only: build the debug `.apk` in Android
  Studio (no JDK/SDK in the build env), and set `VITE_TICKET_ORIGIN` to the deployed URL
  before `cap:sync` so ticket QRs resolve (native origin is `http://localhost`).
- Portfolio README — **done** (no case study, dropped by decision).
- **V1 flow + UI refinement complete (Tasks 11–13, UI passes 1–2).** Every screen is
  now token-painted or deliberately neutral (player `/t`). Next: packs (14–15), or
  further UI polish on user feedback.
- Football pack (Task 14), custom family pack (Task 15).
- Display has no remote channel to the host's phone — a future decision, and it must
  never route through `/t`.
- `generateSet` gives distinct tickets, not the traditional book-of-6 partition of 1–90.

## Key decisions (don't relitigate)

- **THE AIRGAP** is structural: `/t` is its own bundle; `airgap.test.ts` walks its import
  graph and must pass. The SW is precache-only and relays nothing between clients.
- Caller + ticket share `rng.ts` — one PRNG. Tests use fixed seeds (the seed in a failure
  is the repro).
- `ticketId` is Crockford base32, not base36 — deliberate (see the file header).
- New theme = drop a JSON in `themes/`, zero component edits. `note`/`mech` are
  build-time only; app never reads them.
- Storage keys are disjoint: player `tambola:marks:`; host `tambola:host:game`/`:bogeys`/
  `:settings`.
- Deploy: `/t` has no file behind it, so a static host must rewrite unknown paths to
  `index.html`. `vercel.json` ships that; `vite dev` already does it.
