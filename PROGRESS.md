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

**Phase 5 — delivery, paper, verification**
- `src/engine/ticketId.ts` — a ticket ID is the RECIPE for the ticket, not a lookup
  key: `"<setSeed in Crockford base32>-<index>"`, e.g. `K3P9Z-04`. `ticketFromId()`
  rebuilds that exact grid anywhere, with nothing transmitted. Alphabet omits
  I/L/O/U and decoding folds look-alikes (O→0, I/L→1) — base36 let a mistyped ID
  silently resolve to a *different* valid ticket, which is how a host verifies the
  wrong claim. Prefix stability of `generateSet` is what lets the verifier rebuild
  ticket N without knowing the set size (tested)
- `src/ticketLink.ts` — the one place that knows the URL shape:
  `<origin>/t#<ticketId>`. ID lives in the FRAGMENT so it never reaches a server log
  or a Referer header
- **QR delivery (primary path)** — `src/components/QrCode.tsx` (inline SVG via
  `qrcode-generator`, MIT, zero deps, offline) + `TicketsPanel.tsx`: one QR per
  ticket, batch size control, new-batch, tap-ID-to-copy-link, and a warning when
  the host is serving on `localhost` (a phone can't open that)
- **`/t` player route** — `src/player/`: `PlayerApp.tsx`, `TicketCell.tsx`,
  `marks.ts`. Tap to mark (spring fill + vibrate), long-press 450ms to unmark,
  drift >12px cancels the tap so scrolling never marks. Marks persist to
  localStorage per ticket ID so a reload doesn't wipe them. `hashchange` re-opens
  the ticket — scanning a second QR in an open tab used to show the old ticket
- **Print path** — `PrintSheet.tsx` + `@page` rules in `index.css`: A4, 6 per page,
  11mm rows (~21mm columns), ticket ID on every ticket. Mounting the component IS
  the print action; it unmounts on `afterprint`. Offered next to the QR codes, not
  pushed
- **Claim verifier (host only)** — `VerifierPanel.tsx`: type an ID, ticket is
  rebuilt live as you type, called numbers light up on it, all 6 dividends show
  VALID/BOGEY with the missing numbers listed. One tap records the ruling
- **Bogey counter** — `src/store/claimStore.ts`: counts INVALID rulings per ticket
  ID, shown in the verifier and on the ticket's QR card. It compares CALLED numbers
  against the ticket's true 15 — it never sees what the player marked
- `src/main.tsx` split into two dynamic-import entry points (host / player) so the
  two screens are separate bundles with separate module graphs
- `src/player/airgap.test.ts` — walks the player route's real import graph on disk:
  asserts an exact allowlist of 7 reachable modules, no store/caller/host component,
  no fetch/WebSocket/EventSource/BroadcastChannel/postMessage/serviceWorker anywhere
  in the graph, and no called-numbers vocabulary. Plus the reverse: nothing reachable
  from the host entry may touch the `tambola:marks:` key
- 46 tests passing, `npm run build` clean. Verified in-browser at 375x812: QR grid,
  scan → ticket, mark/unmark/scroll guards, reload persistence, print layout
  (2 pages for 8 tickets, 6+2), and host verifier agreeing with `/t` on the same ID
- `PaceIndicator.tsx` lint fix: `react-hooks/set-state-in-effect` was firing because
  the effect eagerly called `setVisible(false)` on every `lastDrawnAt` change (an
  extra render every draw). Replaced the boolean with `nudgedFor: number | null` —
  the timestamp the delayed nudge fired for — and derived `visible` as
  `lastDrawnAt !== null && nudgedFor === lastDrawnAt`. No reset needed: a new draw
  changes `lastDrawnAt`, the two stop matching, nudge hides on that same render.
  `npm run lint` is zero-error again. Behavior unchanged (verified in-browser):
  hidden before any draw, hidden right after a draw, visible at 10s idle, hides
  again on the next draw, stays hidden after undoing back to an empty board

**Phase 6 — room display (`/?display=1`)**
- `src/components/DisplayMode.tsx` — the stage: same app, same store, same tab;
  host casts/AirPlays the tab or plugs in HDMI. No remote channel (V1 decision).
  Optional `&theme=<id>` picks the pack (a cast tab is its own page load, no
  picker chrome on stage)
- Layout: giant number (`min(52vh, 36vw)`, font-black, pure white on
  neutral-950 ≈ 19:1, nothing ever layered behind it), theme-accent phrase in a
  reserved two-line block (no reflow between 1- and 2-line phrases), last-3
  calls with opacity-encoded order (fixed 3 slots, placeholders before there's
  history), full 1–90 board with the freshest call white-ringed (static ring,
  not a pulse — must survive a 30-second-late glance), quiet header
  (theme name + n/90). Reaction layer reused at full intensity
- Entrances: number = physics-only spring (~380ms, no overshoot), phrase
  follows at +140ms. `useReducedMotion` skips both. Legibility floor
  (4m / 79-year-old / lit room) was the constraint every choice deferred to
- Controls on the stage itself (same tab = host holds the device): tap/click
  or Space/Enter = draw; undo is keyboard-only (U/Backspace) so a stray second
  tap can't un-call a number in front of the room
- Theme schema: optional `accent` ("#rrggbb") — types.ts, loader validation
  (malformed accent dies at load; a bad value would otherwise silently render
  the DEFAULT color, the exact fallback §7 forbids), guide §7 documented,
  mythology.json got saffron `#FF9933`, plain.json omits it (proves optional).
  2 new loader tests; 48 total passing, build + lint clean
- Verified in-browser at 1280x720: empty state, mid-game (37/90), plain-theme
  default accent (#fbbf24), keyboard draw/undo, game-over state (90/90 +
  "All ninety numbers called.")

**Phase 7 — reaction layer removed, display themed by data**
- Reaction animations deleted wholesale (`src/anim/` — all 16 SVG components,
  `registry.ts`, `shared.ts` — plus `ReactionLayer.tsx`, `AnimPreview.tsx` and
  the `/?anim` harness). They didn't earn their place. Schema followed: `anim`/
  `animations`/`intensity` gone from types and loader validation, stripped from
  both shipped packs. The loader IGNORES stray legacy anim fields (tested), so
  an old pack still loads. Milestones are now phrase-only
- `display` token block added to the theme schema (same pattern as `accent`):
  the room display's entire visual identity as data — `background`, `number`,
  `phrase`, `boardCalled(Text)`, `boardUncalled(Text)` required; `backdrop`
  (edge wash), `halo` (glow outside the number's strokes), `panel`, `ring`,
  `chrome` optional. Unknown tokens rejected (a typo'd token would silently
  fall back — §7 forbids that)
- **Contrast floors enforced at load** (`contrastRatio()` + `CONTRAST_FLOORS`
  in loader.ts, WCAG relative luminance): number/background 7:1,
  phrase/background 4.5:1, called-cell pair 4.5:1, uncalled-cell pair 3:1.
  A palette that would be unreadable from the back of the room fails at load
  with the actual ratio in the message — never a silent fallback
- `DisplayMode.tsx` rewritten token-driven: every color is a CSS variable
  resolved from `theme.display` with app defaults per token. No per-theme
  branches — grep it for `theme.id`, there are none. The renderer enforces the
  one structural rule itself: the number sits on flat `background` (the
  `backdrop` radial only darkens edges, center 55% stays pure; `halo` is
  text-shadow, outside the glyph strokes)
- mythology.json got the bold look: deep ember stage (#1C0F06) receding to
  near-black edges, warm ivory number (#FFF5E6, ~15:1) with saffron halo,
  saffron phrase/board. plain.json has NO display block and renders the
  default stage — the Task-5-style proof that the block is optional and a new
  look is JSON-only, zero component edits
- Guide §7 + QA checklist rewritten (display tokens documented with floors,
  anim schema removed). 52 tests passing (display validation, contrast math,
  legacy-anim tolerance), build + lint clean. Verified in-browser: mythology
  stage, plain default stage, host screen, draw keys still exact (1 key = 1
  draw)

**Phase 8 — milestone trigger + host persistence**
- **Milestone trigger** — `VerifierPanel.tsx` gained a `theme: Theme` prop (passed
  from `App.tsx`). On a VALID ruling it shows that dividend's `theme.milestones`
  phrase in a plain `text-amber-200` banner (same convention as `NumberDisplay`,
  no new component, no animation). Clears on the next ruling or when the ticket ID
  input changes. VerifierPanel-only by design: the display branch (`/?display=1`)
  is never live at the same time as the verifier, so no cross-store field was added
- **Host persistence** — `src/store/persist.ts` (host-only): two keys disjoint from
  the player's `tambola:marks:` — `tambola:host:game` (`{seed, history, savedAt}`)
  and `tambola:host:bogeys` (`Record<ticketId, number>`). Reads degrade silently to
  "nothing found" on any parse/shape failure; writes return `boolean` and
  `console.warn` on failure (never thrown, never silently swallowed)
- `engine/caller.ts` exposes `seed` and a pure `replayCaller(seed, history)` that
  reconstructs-and-verifies a caller from saved state (throws if history is
  inconsistent with the seed's draw order — a corrupted save can't resurrect a
  wrong board)
- `gameStore`/`claimStore` autosave on their own mutations and expose
  `loadSavedGame`/`loadSavedBogeys` + a `saveFailed` flag (App shows a quiet
  save-failed indicator)
- `src/store/gameSession.ts` — the ONLY code path allowed to touch both stores
  together for resume/new-game, so the two tallies can never drift apart
- `src/components/ResumeGamePrompt.tsx` — on load, if a saved game exists, host is
  gated: resume the in-progress game or start a New Game (the latter clears both
  keys atomically via gameSession). Wired into `App.tsx`
- THE AIRGAP held: `airgap.test.ts` passed unmodified; no new file is reachable
  from `/t`, no host file names the `tambola:marks:` prefix
- Design spec + implementation plan for this phase lived in `docs/superpowers/`
  (removed after landing — PROGRESS.md is the state record; git history retains them)

**Phase 9 — PWA, wake lock, sound, settings**
- **Installable, offline PWA** — `vite-plugin-pwa` in `injectManifest` mode with an
  OWNED service worker `src/sw.ts` (precache-only: `precacheAndRoute(self.__WB_MANIFEST)`
  and nothing else). Registered in `src/main.tsx` for BOTH routes, so a scanned `/t`
  ticket also works offline. The SW's leading comment states THE AIRGAP invariant: it
  must never relay messages between clients (that would be a caller→`/t` channel).
  `src/sw.ts` is excluded from `tsconfig.app.json` (WebWorker vs DOM lib clash; the
  plugin compiles it). Manifest: "Tambola Host", standalone, neutral-950 theme.
  Original saffron "90" numeral icon (`public/app-icon.svg` → generated
  192/512/maskable/apple-touch via `@vite-pwa/assets-generator`). Deleted dead
  scaffold `public/icons.svg`; `favicon.svg` replaced with the new mark
- **Airgap assertion added** — `src/player/airgap.test.ts` gains ONE `it` (existing
  assertions untouched): it reads `src/sw.ts` source and fails on `clients.matchAll`,
  `clients.get`, or `.postMessage(`. The real SW invariant is "relays nothing between
  clients," not "which file calls register()"
- **Wake lock** — `src/useWakeLock.ts`: holds a screen wake lock while a host surface
  is mounted, re-acquires on `visibilitychange`, releases on unmount, feature-detected
  no-op where unsupported. No toggle. Used by `App.tsx` + `DisplayMode.tsx`
- **Sound** — `src/sound.ts`: on draw, speaks the drawn number's phrase — a recorded
  clip if a pack ships `theme.calls[n].audio` (none do yet; path dormant but built),
  else Web Speech API TTS. `langFromLocale` strips a script subtag (`hi-IN-latn` →
  `hi-IN`). Wired via `src/useDrawWithSound.ts` in the draw handler (not an effect), so
  undo and resume never speak. Off by default
- **Settings** — `src/store/settingsStore.ts` persisted to `tambola:host:settings`
  (disjoint from `tambola:marks:` / `tambola:host:game` / `tambola:host:bogeys`).
  `SettingsSheet.tsx` behind a header gear: theme picker (moved out of the header),
  Speak-numbers toggle, Reduce-motion toggle. `useReducedMotionSetting` ORs the OS
  preference with the user toggle (can only ADD reduction) and feeds `DisplayMode`'s
  animation gate
- 90 tests passing (was 52 pre-Phase-8; +milestone/persistence +this phase), build +
  lint clean. `vitest.config.ts` now excludes `.claude/**` so a stale worktree snapshot
  isn't double-discovered. No analytics/accounts/tracking added

## Not started

- Display mode has no channel to the host's phone — drawing happens on the device
  the display runs on. A remote is a future decision, not an oversight; it must
  never route through `/t` or anything a player loads
- `generateSet` still doesn't do the traditional book-of-6 partition of 1–90

## Known decisions worth knowing before continuing

- `generateSet` guarantees distinct tickets only, not the traditional 6-ticket set
  that partitions 1–90 exactly. If a session needs that, it's a new function, not a
  tweak to this one.
- Caller and ticket engines share `rng.ts` on purpose — don't reintroduce a second
  PRNG copy.
- Tests use fixed seeds for reproducibility; if a test fails, the seed in the
  failure message is the reproduction case — don't just re-run and hope.
- **Deploying:** `/t` is a client route with no file behind it. Any static host must
  rewrite unknown paths to `index.html` or scanned QRs 404. **`vercel.json` (rewrite
  `/(.*)` → `/index.html`) now ships in the repo — this fixed the Vercel 404 on
  scanning a ticket.** Other hosts need their own (Netlify `_redirects`, Caddy
  `try_files`). `vite dev` already does this. Filesystem files (`sw.js`, `assets/*`,
  `manifest.webmanifest`) resolve before the rewrite, so the catch-all is safe.
- **Handing out QRs:** the codes encode `window.location.origin`, so the host must be
  serving on a LAN address (`npm run dev -- --host`) — phones can't open `localhost`.
  The Tickets panel says so when it detects it.
- Ticket IDs are Crockford base32, not base36, and it is not cosmetic — see the
  ticketId.ts header. Don't "simplify" it back to `toString(36)`.
- `src/main.tsx`'s two dynamic imports are a safety property, not a style choice.
  Merging the host and player into one component tree re-joins their module graphs
  and `airgap.test.ts` will fail — correctly.
- The player's marks in localStorage are the one same-origin surface both screens
  could theoretically share. The airgap test forbids the host side from naming that
  key prefix; keep it that way.
- New theme pack = drop a JSON file in `themes/`, nothing else. If a task ever
  seems to need touching a component to add a theme, the schema/loader is
  wrong — fix `src/themes/`, not the component. `note`/`mech` are build-time
  only; don't add app code that reads them.

## Suggested next-session prompt

> Read CLAUDE.md and PROGRESS.md first. Next: [describe the next phase — e.g. "the
> room board screen: a big shared display of called numbers, separate from the host's
> phone" or "persist the game (seed + history + bogey tallies) so a host refresh
> doesn't lose the session" or "wire milestone reactions to a VALID ruling in the
> verifier"]. THE AIRGAP still applies — `/t` gains nothing.
