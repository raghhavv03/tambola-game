# Phase 8: PWA + wake lock + sound + settings sheet

Four independent host-side capabilities. None touches the engine, the theme schema,
or `/t`. THE AIRGAP holds throughout: no new file is reachable from
`src/player/PlayerApp.tsx`, and `src/player/airgap.test.ts` must pass **unmodified**.

## Governing constraints (all four features)

- Host-only. Every new module is reachable from `App.tsx`/`DisplayMode.tsx`/`main.tsx`,
  never from `PlayerApp.tsx`.
- The one exception is the service worker (see §1), which by nature also caches the
  `/t` page. It is precache-only — it carries no game state and opens no channel from
  the caller to the player. `airgap.test.ts` still passes unmodified because its SW
  registration lives in `main.tsx`, which the test does not walk.
- New localStorage key: `tambola:host:settings`. Disjoint from the player's
  `tambola:marks:` and from `tambola:host:game` / `tambola:host:bogeys`.
- No analytics, no tracking, no accounts, no third-party IP.
- `npm test`, `npm run build`, `npm run lint` clean before any shared-module task is
  considered done; full suite again at the end.

---

## 1. PWA — installable, offline

**Plugin:** `vite-plugin-pwa` (dev dependency), configured in `vite.config.ts`.

**Config:**
- `registerType: 'autoUpdate'` — the SW updates itself; no update-prompt UI (YAGNI for
  a single-operator prop).
- `manifest`:
  - `name: 'Tambola Host'`, `short_name: 'Tambola'`
  - `description` — one line matching the app.
  - `display: 'standalone'`, `orientation: 'any'` (host may hold portrait; stage is
    landscape).
  - `background_color: '#0a0a0a'`, `theme_color: '#0a0a0a'` (neutral-950, the app's
    own background — no flash on launch).
  - `start_url: '/'`, `scope: '/'`.
  - `icons`: 192 (any), 512 (any), 512 (maskable).
- `workbox.globPatterns`: `['**/*.{js,css,html,svg,png,woff2,json}']` — precache every
  built asset. Everything is local, so precache == full offline. No runtime caching
  rules needed.
- `includeAssets`: the favicon + apple-touch-icon so they're precached too.

**Registration:** in `src/main.tsx` (top level, before the route split), import the
`virtual:pwa-register` helper and register for BOTH routes. Consequences:
- `/t` also becomes offline-capable — a genuine benefit (a scanned ticket reopens with
  no network). The SW serves only static files; it has no `postMessage`/game-data path,
  so this does not breach the airgap.
- `airgap.test.ts` walks the import graph **from `PlayerApp.tsx` and `App.tsx`**, not
  from `main.tsx`. Registration code is therefore outside both walked graphs and the
  test's `serviceWorker`/`postMessage` bans do not trip. The test stays unmodified.
- Registration is feature-detected and wrapped so a browser without SW support is a
  silent no-op.

**Icons:** one original source SVG at `public/app-icon.svg` — a "numeral tile":
a dark rounded-square tile (neutral-900) with a single bold saffron (`#FF9933`,
matching the mythology accent) numeral. Original geometry only; no third-party glyphs
or imagery. From it, generate the PNG set:
- `pwa-192x192.png`, `pwa-512x512.png`, `maskable-512x512.png` (maskable adds safe-area
  padding), `apple-touch-icon-180x180.png`.
- Generated with `@vite-pwa/assets-generator` (`npx pwa-assets-generator`) driven by a
  small `pwa-assets.config.ts`, OR committed as static PNGs if the generator proves
  fiddly — either way the committed outputs live in `public/`.

**index.html:** add `<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">`,
`<meta name="apple-mobile-web-app-capable" content="yes">`,
`<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`,
`<meta name="theme-color" content="#0a0a0a">`. Point the existing `<link rel="icon">`
at the new icon. Update `<title>` to "Tambola Host".

**iOS splash:** minimal — apple-touch-icon + status-bar meta only. Android auto-generates
its splash from the manifest (name + icon + theme_color). The full device-specific
`apple-touch-startup-image` matrix is deliberately skipped (YAGNI).

**Cleanup:** delete dead `public/icons.svg` (Vite-template social icons, unreferenced).
Replace `public/favicon.svg` with the new mark (or keep a favicon derived from
`app-icon.svg`).

---

## 2. Wake lock — screen stays awake mid-game

**`src/useWakeLock.ts`** — a host-only React hook, no arguments.

- On mount: if `'wakeLock' in navigator`, call `navigator.wakeLock.request('screen')`
  and hold the sentinel.
- Browsers auto-release the lock when the tab is hidden. So on `visibilitychange`, if
  the document is visible again and the lock was lost, re-acquire it.
- On unmount: release the sentinel and remove the listener.
- Fully feature-detected: on a browser without the API (older iOS Safari) the hook is a
  silent no-op — never throws, never warns loudly.
- No user toggle. The task is "screen doesn't sleep mid-game"; while the host screen is
  mounted the lock is held. (The `/t` player screen never mounts it.)

**Wiring:** call `useWakeLock()` in `App.tsx` (host controls) and `DisplayMode.tsx`
(the stage). Both are the always-mounted host surfaces.

---

## 3. Sound — preloaded clips or TTS fallback

**`src/sound.ts`** — host-only, framework-free module.

- `speak(text: string, opts: { lang?: string }): void`
  - If TTS is disabled in settings → no-op. (The module reads the setting via a passed
    argument or a getter, NOT by importing React — keep it a plain module. Simplest:
    callers gate the call; `sound.ts` itself just speaks. Decide in the plan: gate in
    the caller so `sound.ts` has no store dependency.)
  - If a preloaded audio clip is registered for this call → play it (`HTMLAudioElement`).
  - Else → Web Speech API: `speechSynthesis.cancel()` then
    `speechSynthesis.speak(new SpeechSynthesisUtterance(text))` with `utterance.lang`
    set from `opts.lang`.
  - Feature-detected: no `speechSynthesis` → no-op.
- Preload: `preloadAudio(urls: string[])` builds `HTMLAudioElement`s so a clip is ready
  before its number is drawn. Dormant today — no shipped theme populates
  `theme.calls[n].audio` — but the code path exists so a future audio pack just works.
- Lang: derive a BCP-47 tag from `theme.locale` by dropping any script subtag
  (`"hi-IN-latn"` → `"hi-IN"`). Romanized-Hinglish TTS is best-effort: no system voice
  reads roman-script Hindi cleanly. Acceptable — clips are the real path when a pack
  ships them; TTS is the graceful degradation.

**Wiring:** on a successful `draw()`, the host surface (`App.tsx`, `DisplayMode.tsx`)
computes the drawn number's phrase (it already does, for display) and — if
`settings.ttsEnabled` — calls `speak(phrase, { lang })`. `undo()` does NOT speak.
The draw tap is the user gesture browsers require before audio/TTS is allowed.

---

## 4. Settings sheet

**`src/store/settingsStore.ts`** — a zustand store persisted to `localStorage` under
`tambola:host:settings`. Host-only; key disjoint from all other app keys.

- Shape: `{ ttsEnabled: boolean; reducedMotion: boolean }`.
- Defaults: `ttsEnabled: false` (host opts in — no surprise audio), `reducedMotion: false`
  (follow the system preference; the toggle only ever forces reduction ON, never off).
- Load/save mirror the existing `persist.ts` discipline: read degrades silently to
  defaults on any parse/shape failure; write is best-effort and does not throw.
  (May reuse `persist.ts` helpers or inline the same pattern — decide in the plan;
  prefer reusing the existing safe read/write if the shapes fit.)

**`src/components/SettingsSheet.tsx`** — a full-screen host panel matching the existing
`TicketsPanel` / `VerifierPanel` pattern (covers the game screen, has a close button).
Contains, top to bottom:
1. **Theme** — the `ThemePicker`, moved here out of the header.
2. **Speak numbers (TTS)** — on/off toggle bound to `settingsStore.ttsEnabled`.
3. **Reduce motion** — on/off toggle bound to `settingsStore.reducedMotion`.

**Header change in `App.tsx`:** the inline `<ThemePicker>` is removed from the header;
a gear/settings button is added alongside Tickets / Check / New Game that opens the
sheet. The panel state widens from `'tickets' | 'verify' | null` to include
`'settings'`.

**Reduced-motion application:** add `src/useReducedMotionSetting.ts` — a hook returning
`systemReducedMotion || settingsStore.reducedMotion` (system pref via motion's
`useReducedMotion`, OR the user toggle). Replace the direct `useReducedMotion()` calls
in the components that gate animation (`NumberDisplay`, `DisplayMode`, and any other
current caller) with this hook, so the user setting actually takes effect. The setting
can only ADD reduction — a user who wants motion still gets none if the OS asks for
none.

---

## What this phase explicitly does NOT do

- No update-available prompt UI (autoUpdate SW handles it silently).
- No full iOS splash-image matrix.
- No wake-lock toggle.
- No audio files shipped (the theme packs still carry none; the preload path is dormant).
- No change to the theme schema, the engine, the caller, or the two persistence keys
  from Phase 8's predecessor.
- No analytics, accounts, or tracking of any kind.

## Testing

Matching the project convention (engine + stores unit-tested; components verified by
build/lint/manual browser check):

- `settingsStore` — unit tests: defaults, round-trip persist, corrupt-value degradation.
- `sound.ts` lang derivation (`"hi-IN-latn"` → `"hi-IN"`) — unit test (pure function).
- `useWakeLock`, `SettingsSheet`, PWA manifest — verified by build + manual in-browser
  check (install prompt, offline reload, gear → sheet, toggles persist across reload,
  TTS speaks on draw when enabled, screen stays awake).
- `airgap.test.ts` — must pass **unmodified**. If it fails, the change is wrong.
