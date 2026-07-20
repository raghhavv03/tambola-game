# Tambola Host

A themed number-caller for a **human host** running a **physical** tambola (housie)
game. The host taps to draw a number 1–90; the app shows it big and hands the host a
themed phrase to say out loud. Players mark their own tickets — on paper, or on their
own phone at `/t`. The matching happens in the player's head.

It is a **prop for the host**, not a game platform.

## The thesis

> The host is the performer. The phone is the teleprompter. The room is the screen.
> Automation would kill the game.

Every design choice falls out of that one line:

- **No auto-marking.** The app never marks a player's ticket. Hearing the number and
  reaching for it *is* the game.
- **No hints.** It never highlights, pulses, or nudges a called number on a player's
  ticket, and never says "you missed one" or "1 away from Full House." If a player
  misses a number, they miss it, and the app says nothing.
- **No auto-calling.** The host draws each number by hand. No timer, no autoplay.

These aren't settings. They're the product.

## THE AIRGAP

The rules above are enforced **structurally, not by policy.**

The player's ticket route (`/t`) receives everything it will ever know from the QR's
URL, and after that opens **no channel of any kind** to the caller — no socket, no poll,
no fetch, no shared store. The host screen and the player screen are two separate
bundles with two separate module graphs (`src/main.tsx` splits them by dynamic import).
A test (`src/player/airgap.test.ts`) walks the player's import graph on disk and fails
the build if any reachable module could touch the caller, a host store, or any network
API — or even names the vocabulary of "called numbers."

The line is subtle and easy to get wrong in both directions: a room display showing a
board of called numbers is **correct and traditional** — the physical board always did
that. That same cross-reference happening **on the player's own ticket** is fatal. The
line is not *what the app shows* — it is **who does the matching**, and that stays in
the player's head.

## Themes are the product

The app is a renderer; the **theme packs** are the thing. A pack is pure JSON: a spoken
phrase and a display glyph for each of the 90 numbers, six milestone phrases, and an
optional visual identity (colors, validated for contrast at load).

Adding a pack is dropping a file in `themes/` — **zero component changes.** The renderer
never special-cases a pack; a loader validates every pack at startup and crashes loudly
on a missing key rather than falling back silently. Two packs ship: `mythology.json`
(Puranic) and a deliberately minimal `plain.json` that proves the abstraction.

Authoring a pack: see **[THEME_PACK_GUIDE.md](THEME_PACK_GUIDE.md)**.

## Surfaces

- **Host screen** (`/`) — the caller: giant number, themed phrase, DRAW, a 1–90 board,
  undo, tickets, claim verifier, settings.
- **Player ticket** (`/t#<id>`) — a scanned ticket, tap to mark. Airgapped.
- **Room display** (`/?display=1`) — the stage for a TV/projector; cast or HDMI.

Runs fully offline as an installable PWA; wraps to a native Android app via Capacitor.
No backend, no accounts, no analytics, no money features — real-money gaming is illegal
in India (PROG Act 2025), and none of it belongs in a party prop anyway.

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · zustand · motion · Vitest · vite-plugin-pwa
· Capacitor. Game logic (`src/engine/`) is pure TypeScript with its own tests.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173  (add ?display=1 for the stage)
npm test         # engine + persistence tests
npm run build    # typecheck + production build (PWA + service worker)
```

Deploy is any static host; `vercel.json` ships the SPA rewrite so scanned `/t` links
resolve. See **[RUNBOOK.md](RUNBOOK.md)** for the build sequence and native/Play-Store
steps, **[PROGRESS.md](PROGRESS.md)** for current state, and **[CLAUDE.md](CLAUDE.md)**
for the non-negotiables.
