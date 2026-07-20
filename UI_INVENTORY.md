# UI Inventory

Every screen, section, button, and component in the app, with its source file — a
worksheet for polishing the UI element by element. Check items off as they get a
dedicated pass. Read with `CLAUDE.md` (rules — especially THE AIRGAP) before
touching anything on the player side.

**Ground rules for any UI change**
- Host surfaces are painted ONLY by stage tokens (`src/themes/stage.ts`) — never a
  hardcoded theme color, never an `if (theme.id === ...)`.
- The player ticket (`/t`) is deliberately neutral and must stay that way: it must
  not know which pack the host runs, and `src/player/airgap.test.ts` must pass
  unmodified.
- Semantic colors are exempt from theming on purpose: amber = warning, red =
  bogey/danger, emerald = valid verdict.
- Verify with: `npm test`, `npm run build`, `npx eslint src`, quick browser check
  in BOTH themes (Plain + Puranic).

---

## Design system primitives (shared — changing these changes every screen)

- [ ] **Stage tokens** — `src/themes/stage.ts`
  - `stageVariables(theme)` → the CSS variable set: `--stage-bg`, `--stage-backdrop`,
    `--stage-number`, `--stage-halo`, `--stage-phrase`, `--stage-panel`,
    `--board-called`, `--board-called-text`, `--board-uncalled`,
    `--board-uncalled-text`, `--stage-ring`, `--stage-chrome`
  - `DEFAULT_STAGE` / `DEFAULT_ACCENT` — the neutral look for packs without tokens
  - `AMBIENT_BACKGROUND` — the top accent-glow background all host screens share
  - `themeSwatch(theme)` — the 4-color preview the theme cards render from
- [ ] **`btn-accent` utility** — `src/index.css` — THE primary-action look
  (gradient + glow from `--board-called`). Used by: DRAW, Start/Resume/Continue
  (home), New Game (game-over), Resume (display gate).
- [ ] **`font-display`** — `src/index.css` `@theme` — Fraunces Variable (self-hosted,
  offline-safe). Used on: headings, hero numbers, theme card names, stage number.
- [ ] **Icon set** — `src/components/icons.tsx` — inline Lucide-path SVGs:
  ChevronLeft, Settings, Cast, Ticket, BadgeCheck, Undo, Play, Printer, Trophy.
  All 1em, stroke-based, `aria-hidden` (the button carries the label).
- [ ] **Contrast floors** — `src/themes/loader.ts` (`CONTRAST_FLOORS`) — data-side
  guarantee that any themed pairing stays legible; not a UI file, but the reason
  token pairings are safe to use.
- [ ] **Print stylesheet** — `src/index.css` `@page` / `@media print`.

---

## 1. Home — `/` (default screen) — `src/components/HomeScreen.tsx`

- [ ] Title block — "Tambola" (`font-display`) + tagline (doubles as first-run hint)
- [ ] "Theme" section label (overline style)
- [ ] **ThemePicker** — `src/components/ThemePicker.tsx` — grid of live-preview
  cards, each painted in its own pack's palette; 3-dot palette preview; selected
  card ringed in the pack's accent; `role="radiogroup"`
- [ ] Primary CTA (btn-accent), one of three states:
  - [ ] "Start game" (+ Play icon) — fresh
  - [ ] "Resume game" + count/saved-ago subtitle — saved game on disk
  - [ ] "Continue game" + count subtitle — game running this session
- [ ] Secondary button — "Start new game" / "New game" (panel-toned; the
  mid-game variant guards with a native `window.confirm`)
- [ ] Nav tiles ×3 (icon + label): Tickets · Display · Settings
- [ ] Root ambience — ambient glow + token background (set in `App.tsx`)

## 2. Caller — `/` after Start — `src/App.tsx` (layout) + components

Header (all buttons 44px, labels fold to icons below `sm`):
- [ ] "‹ Home" button (ChevronLeft)
- [ ] "Not saving to this device" warning badge (red, only on storage failure)
- [ ] Cast button (Cast icon) → re-renders tab as room display
- [ ] Tickets button (Ticket icon) → opens panel
- [ ] Check button (BadgeCheck icon) → opens verifier
- [ ] Settings button (gear icon) → opens sheet
- [ ] **UndoButton** — `src/components/UndoButton.tsx` — outlined, chrome-toned,
  deliberately far from DRAW
- [ ] Resume-failed banner (amber, dismissible ×) — only after a failed resume

Body:
- [ ] **NumberDisplay** — `src/components/NumberDisplay.tsx` — the hero card:
  - [ ] "CURRENT NUMBER" overline
  - [ ] dashed accent ring
  - [ ] the number (`font-display`, halo text-shadow, spring entrance keyed on
    drawSeq, respects reduce-motion)
  - [ ] phrase pill (reserved 2-line height, accent-tinted bg)
- [ ] **RecentNumbers** — `src/components/RecentNumbers.tsx` — "EARLIER" label +
  5 fixed slots, opacity fade encodes order, faint dot when empty
- [ ] **NumberGrid** — `src/components/NumberGrid.tsx` — 1–90 board, 10-wide,
  called/uncalled board tokens, wrapped in a panel card (wrapper in App.tsx)
- [ ] **PaceIndicator** — `src/components/PaceIndicator.tsx` — "Next number?"
  nudge, fades in 10s after a draw (never auto-draws)
- [ ] **DrawButton** — `src/components/DrawButton.tsx` — btn-accent, full-width

## 3. Game complete — caller at 90/90 — `src/components/GameOverCard.tsx`

- [ ] Trophy icon (accent-phrase toned)
- [ ] "Game complete" heading (`font-display`) + "All ninety numbers called."
- [ ] "New game" button (btn-accent, no confirm — game is finished)
- [ ] Board stays visible below; DRAW + pace hidden

## 4. Tickets panel — overlay — `src/components/TicketsPanel.tsx`

- [ ] Sticky header — "Tickets" (`font-display`) + Close button (backdrop-blur)
- [ ] "How many" number input (1–60)
- [ ] "New batch" button
- [ ] "Print on paper" button (Printer icon) → mounts PrintSheet
- [ ] localhost warning banner (amber) — QRs unreachable from phones
- [ ] Ticket card grid — per card:
  - [ ] **QrCode** — `src/components/QrCode.tsx` — inline SVG, MUST stay flat
    white/black (scanning requirement, never themed)
  - [ ] ticket ID button (tap = copy link, "link copied" confirmation)
  - [ ] bogey count chip (red, only if > 0)

## 5. Check a claim — overlay — `src/components/VerifierPanel.tsx`

- [ ] Sticky header — "Check a claim" (`font-display`) + Close
- [ ] Ticket ID input (mono, uppercase, live-parsed — no submit button)
- [ ] "N numbers called so far." helper line
- [ ] "Not a ticket ID yet" hint (amber)
- [ ] Ticket ID echo + previous-bogeys chip (red)
- [ ] Milestone phrase line (accent-phrase, shown after a VALID ruling)
- [ ] **TicketFace** — `src/components/TicketFace.tsx` — read-only ticket, called
  numbers lit emerald (host-side cross-reference; fine HERE, fatal on /t)
- [ ] Dividend rows ×6 (Early Five → Full House) — label, "x of y called",
  missing numbers, and:
  - [ ] VALID button (emerald) / BOGEY button (red) — semantic, stays unthemed
  - [ ] "✓" confirmation on the row just ruled

## 6. Settings — overlay — `src/components/SettingsSheet.tsx`

- [ ] Sticky header — "Settings" (`font-display`) + Done
- [ ] Theme section — same ThemePicker as home
- [ ] Toggle — "Speak numbers" (accent-colored checkbox)
- [ ] Toggle — "Reduce motion"
- [ ] (candidate: replace bare checkboxes with proper switch controls)

## 7. Print sheet — print-only — `src/components/PrintSheet.tsx`

- [ ] A4 layout, 6 tickets per page, TicketFace `variant="print"` (black on
  white, 11mm pen-sized rows), ID under each ticket
- [ ] Only element visible on paper (everything else is `print:hidden`)

## 8. Room display — `/?display=1&theme=<id>` — `src/components/DisplayMode.tsx`

- [ ] Header: "‹ Host" exit button (stopPropagation — leaving can't draw) ·
  theme name (`font-display`) · "N / 90" progress
- [ ] The stage number (`font-display`, halo, spring entrance, no-overshoot)
- [ ] Phrase line (reserved 2-line block, "Waiting for the first number…" idle,
  "All ninety numbers called." at game over)
- [ ] RecentCalls — 3 fixed tiles, opacity fade (local to this file)
- [ ] Board — 1–90, board tokens, ring on the freshest call (local to this file)
- [ ] Footer operator hint — "Tap or press Space to draw · U to undo · Esc to exit"
- [ ] Interactions: tap/Space/Enter = draw, U/Backspace = undo, Esc = exit
- [ ] Edge-darkening backdrop radial (center 55% stays pure background)

## 9. Resume gate — `?display=1` load with a saved game —
`src/components/ResumeGamePrompt.tsx`

- [ ] "Resume the last game?" (`font-display`) + count/saved-ago line
- [ ] "Resume game" (btn-accent) / "Start new game" (panel)
- [ ] Wrapped in the DISPLAY theme's tokens + ambient (wrapper in App.tsx) —
  home is the gate on the normal host path; this only guards display loads

## 10. Player ticket — `/t#<id>` — `src/player/PlayerApp.tsx` (AIRGAPPED)

Neutral palette only. No theme tokens, no new imports, no called-number anything.
- [ ] Header — "Your ticket" (`font-display` via global CSS, allowed) + ID chip
- [ ] Ticket frame card (subtle border/bg)
- [ ] **TicketCell** ×27 — `src/player/TicketCell.tsx`:
  - [ ] tap = mark (amber flood, spring, vibration)
  - [ ] long-press 450ms = unmark (shrinking red ring telegraphs it)
  - [ ] drift tolerance so scrolling never marks
- [ ] Footer instructions — mark/unmark + "Shout your claim out loud"

## 11. Bad link — `/t` with missing/invalid code — `BadLink` in `PlayerApp.tsx`

- [ ] "Can't open this ticket" (`font-display`) + reason + "ask the host" line

---

## Native dialogs (candidates to replace with styled in-app confirms)

- [ ] `window.confirm` — "Start a new game?" — HomeScreen (mid-game New game)

## Known UX gaps / ideas (not commitments)

- Board on the caller clips below 40 on short screens (scrolls) — consider a
  denser grid or collapsible board
- Room display is landscape-first by design; portrait phones squish the side
  panel — acceptable, but an explicit "rotate for best view" hint is an option
- Settings toggles are bare checkboxes
- No focus-visible styling pass has been done for keyboard users
- Copy-link on ticket IDs has no fallback message when clipboard is blocked
