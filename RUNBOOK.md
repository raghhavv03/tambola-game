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

## Done (tasks 1–8)

Scaffold + guardrails · caller engine · ticket + verifier · host screen · theme system
· ticket delivery/marking/verifier + airgap · room display (`?display=1`) · PWA + wake
lock + sound + settings. Plus: host persistence, milestone phrases, Vercel SPA rewrite
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

### Task 10 · README + case study — Sonnet 5
README for a portfolio reader: what it is, the thesis (*host performs, phone is the
teleprompter, room is the screen, automation would kill the game*), why no auto-marking /
no ticket hints / no auto-call, and how the airgap enforces that structurally. Theme-pack
architecture + how to author one (link `THEME_PACK_GUIDE.md`). Scaffold `CASE_STUDY.md`
headers with a note on what evidence goes under each.

### Task 11 · Theme pack #2: football — Fable 5
Use the §9 prompt in `THEME_PACK_GUIDE.md` verbatim. Football covers mythology's dead
zone (65–87). Check numeric **spread**, not just count — 25 refs all under 40 is a worse
pack than 18 spread evenly.

### Task 12 · Custom family pack generator — Sonnet 5 (phrases are the user's)
Template slots (`{name}`, `{relation}`, `{running_joke}`) filled at setup, with a
**mandatory host review before the game** (safety feature, guide §6). Highest-value
feature; lives where mythology is weakest (41–79).

## Deferred — decided, don't relitigate

Remote audio/mic/WebRTC · ticket import/OCR · multiplayer/backend → **No.**
Auto-marking · called-number hints on a player's ticket · "you missed one" / "1 away"
nudges · any money feature · third-party IP → **Never** (the airgap + the law).
Hiding the board from the ROOM screen → **No**, that's traditional and correct.
Auto-call timer → optional accessibility toggle at most, never default.

## Game-night test (run after 11)

Sit in the room, don't touch the phone. Which phrases landed vs died (cut the dead ones)?
Did anyone stop watching their ticket to watch a screen (that's a bug)? Did a claim
dispute get settled faster than the argument? Did anyone ask why their ticket doesn't
light up (the asking IS the game — say so)? Film 20 seconds of the room laughing — that's
the portfolio.
