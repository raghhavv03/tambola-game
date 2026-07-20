# Tambola Host — Runbook (simplified)

Companion to `CLAUDE.md` (rules), `PROGRESS.md` (state), `THEME_PACK_GUIDE.md` (packs).
This file is the sequence and the working style. One task = one session.

## How we work (read this first)

The last big task got buried under a spec→plan→execute ceremony. Don't do that again.

- **Build directly, one pass.** No spec doc, no plan doc, no subagent handoff, no
  `superpowers` skill chain. Understand the ask, build it, verify, done.
- **Test where it earns it.** Engine (`caller`, `ticket`) and persistence get real
  tests. Components: build + lint + a quick browser check. No React unit tests, no
  over-testing, no token churn.
- **The airgap is sacred.** `/t` learns nothing from the caller — ever. `airgap.test.ts`
  must pass unmodified (adding a stricter assertion is fine; loosening one is the bug).
- **Simple but impressive.** Boring code, sharp result. Legibility beats decoration.
- **Model:** Opus 4.8 for logic/multi-file; Fable 5 only for taste ceilings (theme packs,
  display polish). Everything else runs fine on Opus/Sonnet — don't overthink it.

## Done (tasks 1–10)

Scaffold + guardrails · caller engine · ticket + verifier · host screen · theme system
· ticket delivery/marking/verifier + airgap · room display (`?display=1`) · PWA + wake
lock + sound + settings · Capacitor Android setup (repo side; apk on user machine) ·
portfolio README. Plus: host persistence, milestone phrases, Vercel SPA rewrite
(`vercel.json`). See `PROGRESS.md` for the detail.

## Remaining

### Task 9 · Capacitor Android wrap — Opus 4.8

**Repo setup DONE** (this session): `@capacitor/core` + `cli` + `android` installed,
`capacitor.config.ts` (appId `com.raghavgupta.tambola`, appName "Tambola Host",
webDir `dist`), `android/` platform scaffolded, icons + splash generated from
`assets/logo.png` (the saffron "90", dark bg) via `@capacitor/assets`. Scripts:
`npm run cap:sync` (build + copy into android), `npm run cap:open` (open Android Studio).

**One required config for delivery:** inside the native app `window.location.origin` is
`http://localhost`, which a player's phone can't open. So the ticket QRs read
`VITE_TICKET_ORIGIN` (TicketsPanel). **Before building the native app, set it to the
deployed web URL:**
```bash
VITE_TICKET_ORIGIN="https://<your-vercel-app>.vercel.app" npm run cap:sync
```
Web builds leave it unset (QRs use the current origin, unchanged). This moves a URL
format only — the airgap holds.

**Build the APK (your machine — needs Android Studio + JDK, not available in the build
env here):**
1. Install Android Studio (bundles the SDK + JDK).
2. `npm run cap:open` → opens the `android/` project in Android Studio.
3. Let Gradle sync. Plug in your phone (USB debugging on) or start an emulator.
4. Run ▶, or Build → Build APK(s); the debug `.apk` lands in
   `android/app/build/outputs/apk/debug/`.

**Play Store (NOT done, state plainly):** $25 one-time fee, privacy policy URL, Data
Safety form, content rating (**declare no gambling, no real money — truthfully**), and
for individual accounts **12 testers running a 14-day closed test** — that clock is the
long pole. iOS is $99/yr and stricter — Android first, or neither.

### Task 10 · README — DONE
Portfolio README written (thesis, non-negotiables, airgap, theme architecture, run/deploy
pointers). Case study dropped by decision — not doing one.

---

## V1 completion — flow + UX (do these next, before new packs)

These close out V1: the app should feel complete to use, not just be feature-complete.
Keep them SIMPLE — structure and flow first, deep UI polish comes after (user does UI).

### Task 11 · Apply the active theme across the whole app — DONE
Right now a theme's **visual identity** (`display` token block: colors/accent) only paints
the room display (`?display=1`). The host screen (`/`) is hardcoded neutral + amber and a
theme only swaps its *phrases*. Make the selected theme (e.g. Puranic) paint the **host
screen too** — number, phrase, board, accents — using the same `display`/`accent` tokens,
with the app's neutral look as the default when a pack omits them. No new schema; reuse
the existing token block and contrast floors. Theme-agnostic renderer stays theme-agnostic
(no `theme.id` branches). DONE-WHEN: picking Puranic on the host screen visibly themes it,
plain.json still renders the default look, and adding a future pack needs zero component
edits.

### Task 12 · Home screen + navigation — DONE
Add a home/landing screen (route `/` before the caller) so the app has a front door
instead of dropping straight into the board. It should offer: **New Game** / **Resume**
(reuse the existing resume gate), **theme pick**, **Play** (enter the caller), plus clear
entries to **Tickets**, **Room display**, and **Settings**. Move the theme picker here and
in Settings (already there). Keep it plain — layout and flow, not decoration. The caller
screen stays reachable and unchanged. DONE-WHEN: a first-time host lands on home, picks a
theme, and starts a game without hunting for controls.

### Task 13 · Flow/UX gaps — DONE
All four items landed (persist-theme + first-run hint in Task 12; cast button on the
caller header + GameOverCard in the UI pass). Host casts in one tap, theme sticks
across reloads, finished game has a clear end + New Game.

### UI refinement (ongoing, between 13 and 14)
Passes 1–3 done (see PROGRESS P11–P13): Fraunces + tokens everywhere, home/caller
redesign, panels themed, one `btn-accent` primary look, display exit. The worksheet
for further element-by-element polish is **UI_INVENTORY.md** — work through it screen
by screen; verify in BOTH packs (Plain + Puranic) every time.

---

## Post-V1 — new packs

### Task 14 · Theme pack #2: football — Fable 5
Use the §9 prompt in `THEME_PACK_GUIDE.md` verbatim. Football covers mythology's dead
zone (65–87). Check numeric **spread**, not just count — 25 refs all under 40 is a worse
pack than 18 spread evenly.

### Task 15 · Custom family pack generator — Sonnet 5 (phrases are the user's)
Template slots (`{name}`, `{relation}`, `{running_joke}`) filled at setup, with a
**mandatory host review before the game** (safety feature, guide §6). Highest-value
feature; lives where mythology is weakest (41–79).

## Deferred — decided, don't relitigate

Remote audio/mic/WebRTC · ticket import/OCR · multiplayer/backend → **No.**
Auto-marking · called-number hints on a player's ticket · "you missed one" / "1 away"
nudges · any money feature · third-party IP → **Never** (the airgap + the law).
Hiding the board from the ROOM screen → **No**, that's traditional and correct.
Auto-call timer → optional accessibility toggle at most, never default.

## Game-night test (run after 14)

Sit in the room, don't touch the phone. Which phrases landed vs died (cut the dead ones)?
Did anyone stop watching their ticket to watch a screen (that's a bug)? Did a claim
dispute get settled faster than the argument? Did anyone ask why their ticket doesn't
light up (the asking IS the game — say so)? Film 20 seconds of the room laughing — that's
the portfolio.
