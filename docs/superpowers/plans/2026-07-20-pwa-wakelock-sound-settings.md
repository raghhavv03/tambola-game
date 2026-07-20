# Phase 8: PWA + Wake Lock + Sound + Settings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the host app an installable, offline-capable PWA; keep the host's screen awake mid-game; speak the drawn number's phrase (recorded clip if a pack ships one, else Web Speech TTS); and add a settings sheet (theme picker, TTS on/off, reduce motion).

**Architecture:** Four independent host-side features. A persisted `settingsStore` (zustand, localStorage key `tambola:host:settings`) holds TTS + reduce-motion flags. A framework-free `sound.ts` speaks phrases; a small hook composes it with `gameStore.draw`. A `useWakeLock` hook holds a screen wake lock while a host surface is mounted. The PWA uses `vite-plugin-pwa` in `injectManifest` mode with an owned, precache-only `src/sw.ts`, so the airgap invariant ("the SW relays nothing between clients") is asserted against source we control. Nothing touches the engine, the theme schema, or `/t`.

**Tech Stack:** Vite 8, React 19, TypeScript 6, zustand 5, motion 12, Vitest 4 (node env), `vite-plugin-pwa` 1.3 + workbox 7.

## Global Constraints

- **THE AIRGAP.** No new file may be reachable from `src/player/PlayerApp.tsx`. Every EXISTING assertion in `src/player/airgap.test.ts` passes unchanged. This phase ADDS exactly one new assertion (Task 7) — the SW message-relay check — and modifies none of the existing ones.
- New localStorage key: `tambola:host:settings`. Disjoint from `tambola:marks:` (player) and `tambola:host:game` / `tambola:host:bogeys`.
- Host-only. Every new module is imported only from `App.tsx` / `DisplayMode.tsx` / `main.tsx`. The single exception is the service worker, which by nature caches `/t` too; it is precache-only and carries no game state.
- No analytics, no tracking, no accounts, no third-party IP. Icon art is original geometry only.
- Governing spec: `docs/superpowers/specs/2026-07-20-pwa-wakelock-sound-settings-design.md`. Do not redesign in-flight.
- Tests run in the **node** environment — there is no `window`/`localStorage`/`navigator`. Use `src/test/mockLocalStorage.ts` (`installMockLocalStorage`) as the existing tests do; feature-detect all browser APIs in source so node imports don't crash.
- Run `npm test`, `npm run build`, `npm run lint` clean before any task that touches shared modules is considered done; run the full suite again at the end.
- Reduce-motion default follows the OS; the toggle can only ADD reduction, never override an OS request for reduced motion.

---

### Task 1: Settings persistence + `settingsStore`

**Files:**
- Modify: `src/store/persist.ts` (add settings read/write, mirroring the existing game/bogeys pattern)
- Create: `src/store/settingsStore.ts`
- Test: `src/store/persist.test.ts` (add settings cases), `src/store/settingsStore.test.ts` (new)

**Interfaces:**
- Consumes: `readJSON`/`writeJSON` (module-private helpers already in `persist.ts`), `installMockLocalStorage` from `src/test/mockLocalStorage.ts`.
- Produces:
  - `persist.PersistedSettings = { ttsEnabled: boolean; reducedMotion: boolean }`
  - `persist.saveSettings(s: PersistedSettings): boolean`
  - `persist.loadSettings(): PersistedSettings` (never null — returns defaults, per-field, on any failure)
  - `useSettingsStore` with `{ ttsEnabled, reducedMotion, setTtsEnabled(v), setReducedMotion(v) }`

- [ ] **Step 1: Write the failing persist tests**

Add to `src/store/persist.test.ts` (after the existing imports, extend the import from `./persist` to include `saveSettings, loadSettings`):

```ts
describe('settings persistence', () => {
  it('round-trips both flags', () => {
    expect(saveSettings({ ttsEnabled: true, reducedMotion: true })).toBe(true)
    expect(loadSettings()).toEqual({ ttsEnabled: true, reducedMotion: true })
  })

  it('returns defaults (both false) when nothing was saved', () => {
    expect(loadSettings()).toEqual({ ttsEnabled: false, reducedMotion: false })
  })

  it('returns defaults on malformed JSON', () => {
    store.setItem('tambola:host:settings', '{not json')
    expect(loadSettings()).toEqual({ ttsEnabled: false, reducedMotion: false })
  })

  it('degrades a bad field to its default, keeping the good one', () => {
    store.setItem(
      'tambola:host:settings',
      JSON.stringify({ ttsEnabled: true, reducedMotion: 'yes' }),
    )
    expect(loadSettings()).toEqual({ ttsEnabled: true, reducedMotion: false })
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- persist`
Expected: FAIL — `saveSettings`/`loadSettings` are not exported.

- [ ] **Step 3: Implement settings read/write in `persist.ts`**

Add near the other keys (after `BOGEYS_KEY`):

```ts
const SETTINGS_KEY = 'tambola:host:settings'

export interface PersistedSettings {
  ttsEnabled: boolean
  reducedMotion: boolean
}

// Speaking numbers aloud is opt-in (no surprise audio on first open); reduced
// motion defaults to "follow the OS" (false = don't force it).
const DEFAULT_SETTINGS: PersistedSettings = { ttsEnabled: false, reducedMotion: false }

export function saveSettings(settings: PersistedSettings): boolean {
  return writeJSON(SETTINGS_KEY, settings)
}

export function loadSettings(): PersistedSettings {
  const parsed = readJSON<Partial<PersistedSettings>>(SETTINGS_KEY)
  if (parsed === null || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS }
  // Validate each field independently so one corrupt flag can't discard the other.
  return {
    ttsEnabled:
      typeof parsed.ttsEnabled === 'boolean' ? parsed.ttsEnabled : DEFAULT_SETTINGS.ttsEnabled,
    reducedMotion:
      typeof parsed.reducedMotion === 'boolean'
        ? parsed.reducedMotion
        : DEFAULT_SETTINGS.reducedMotion,
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- persist`
Expected: PASS (all settings cases green).

- [ ] **Step 5: Write the failing store test**

Create `src/store/settingsStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { installMockLocalStorage } from '../test/mockLocalStorage'
import { loadSettings } from './persist'

beforeEach(() => {
  installMockLocalStorage()
})

describe('settingsStore', () => {
  it('setters persist to localStorage', async () => {
    // Fresh import each test so the store re-reads storage at module init.
    const { useSettingsStore } = await import('./settingsStore')
    useSettingsStore.getState().setTtsEnabled(true)
    expect(useSettingsStore.getState().ttsEnabled).toBe(true)
    expect(loadSettings().ttsEnabled).toBe(true)
    useSettingsStore.getState().setReducedMotion(true)
    expect(loadSettings()).toEqual({ ttsEnabled: true, reducedMotion: true })
  })
})
```

Note: the store initialises from `loadSettings()` at module load. Because a module is imported once per process, this single test exercises the setters + persistence; defaults-on-load are covered by the persist tests above. Use a dynamic `import()` so the mock storage is installed first.

- [ ] **Step 6: Run it to verify it fails**

Run: `npm test -- settingsStore`
Expected: FAIL — `./settingsStore` does not exist.

- [ ] **Step 7: Implement `settingsStore.ts`**

Create `src/store/settingsStore.ts`:

```ts
// Host UI preferences: speak-numbers (TTS) and reduce-motion. Persisted to
// localStorage (tambola:host:settings) via persist.ts, disjoint from the game
// state and the player's marks. Host-only — never imported under src/player/.

import { create } from 'zustand'
import * as persist from './persist'

interface SettingsState {
  ttsEnabled: boolean
  reducedMotion: boolean
  setTtsEnabled: (value: boolean) => void
  setReducedMotion: (value: boolean) => void
}

// Read once at module load — the saved prefs (or their defaults).
const initial = persist.loadSettings()

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ttsEnabled: initial.ttsEnabled,
  reducedMotion: initial.reducedMotion,

  setTtsEnabled: (value) =>
    set(() => {
      // Persist the whole snapshot so a partial write can never desync the two.
      persist.saveSettings({ ttsEnabled: value, reducedMotion: get().reducedMotion })
      return { ttsEnabled: value }
    }),

  setReducedMotion: (value) =>
    set(() => {
      persist.saveSettings({ ttsEnabled: get().ttsEnabled, reducedMotion: value })
      return { reducedMotion: value }
    }),
}))
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npm test -- settingsStore`
Expected: PASS.

- [ ] **Step 9: Full suite + build + lint**

Run: `npm test && npm run build && npm run lint`
Expected: all green (52 prior + new settings cases).

- [ ] **Step 10: Commit**

```bash
git add src/store/persist.ts src/store/settingsStore.ts src/store/persist.test.ts src/store/settingsStore.test.ts
git commit -m "feat(settings): persisted settingsStore (TTS + reduce-motion flags)"
```

---

### Task 2: `sound.ts` — speak phrases, clip-or-TTS

**Files:**
- Create: `src/sound.ts`
- Test: `src/sound.test.ts` (new — covers the pure `langFromLocale` only; `speak`/`preload` are browser-API glue, verified manually in Task 3/6)

**Interfaces:**
- Produces:
  - `langFromLocale(locale: string): string` — pure. `"hi-IN-latn"` → `"hi-IN"`, `"en"` → `"en"`, `""` → `""`.
  - `speak(text: string, opts?: { lang?: string; audioUrl?: string }): void`
  - `preloadAudio(urls: string[]): void`

- [ ] **Step 1: Write the failing test**

Create `src/sound.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { langFromLocale } from './sound'

describe('langFromLocale', () => {
  it('drops a script subtag, keeping language + region', () => {
    expect(langFromLocale('hi-IN-latn')).toBe('hi-IN')
  })
  it('keeps a plain language-region tag', () => {
    expect(langFromLocale('en-IN')).toBe('en-IN')
  })
  it('keeps a bare language', () => {
    expect(langFromLocale('en')).toBe('en')
  })
  it('returns empty for empty', () => {
    expect(langFromLocale('')).toBe('')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- sound`
Expected: FAIL — `./sound` does not exist.

- [ ] **Step 3: Implement `sound.ts`**

Create `src/sound.ts`:

```ts
// Speaks the drawn number's themed phrase for the HOST. Two paths:
//   1. a recorded clip, if the pack ships theme.calls[n].audio (none do today —
//      this path is dormant but ready), or
//   2. the Web Speech API (browser TTS) as the fallback.
// Host-only: never imported under src/player/. Nothing here reaches the caller
// or the network — it only voices a string it is handed.
//
// Every browser API is feature-detected so this module imports cleanly in the
// node test environment (no window/speechSynthesis there).

/**
 * A BCP-47 lang tag for SpeechSynthesis, derived from a theme locale by dropping
 * a script subtag. "hi-IN-latn" -> "hi-IN": the phrases are romanized Hindi, so
 * a script tag would only confuse voice selection. Best-effort — no system voice
 * reads roman-script Hindi cleanly, which is exactly why recorded clips are the
 * real path once a pack ships them.
 */
export function langFromLocale(locale: string): string {
  const parts = locale.split('-')
  // Keep language and (if present) a 2-letter/3-digit region; drop a 4-letter
  // script subtag like "latn" and anything after it.
  const kept = parts.filter((part, i) => i < 2 || /^[A-Za-z]{2}$|^\d{3}$/.test(part))
  // After index 1 we only want a region, not a script — take at most lang+region.
  return kept.slice(0, 2).join('-')
}

// Preloaded clips, keyed by URL, so a clip is ready before its number is drawn.
const clips = new Map<string, HTMLAudioElement>()

export function preloadAudio(urls: string[]): void {
  if (typeof Audio === 'undefined') return
  for (const url of urls) {
    if (clips.has(url)) continue
    const audio = new Audio(url)
    audio.preload = 'auto'
    clips.set(url, audio)
  }
}

export function speak(text: string, opts: { lang?: string; audioUrl?: string } = {}): void {
  if (!text) return

  // Path 1: a recorded clip for this call.
  if (opts.audioUrl) {
    const existing = clips.get(opts.audioUrl)
    const audio = existing ?? (typeof Audio !== 'undefined' ? new Audio(opts.audioUrl) : null)
    if (audio) {
      audio.currentTime = 0
      void audio.play().catch(() => {
        // Autoplay/decoding can fail; a silent miss is fine for a caller aid.
      })
      return
    }
  }

  // Path 2: Web Speech API TTS.
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel() // never queue — the newest number wins
  const utterance = new SpeechSynthesisUtterance(text)
  if (opts.lang) utterance.lang = opts.lang
  window.speechSynthesis.speak(utterance)
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- sound`
Expected: PASS.

- [ ] **Step 5: Full suite + build + lint**

Run: `npm test && npm run build && npm run lint`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/sound.ts src/sound.test.ts
git commit -m "feat(sound): speak drawn phrase via recorded clip or Web Speech TTS"
```

---

### Task 3: Speak on draw — wire sound into the host surfaces

**Files:**
- Create: `src/useDrawWithSound.ts`
- Modify: `src/App.tsx` (use the wrapped draw for `DrawButton`)
- Modify: `src/components/DisplayMode.tsx` (use the wrapped draw at its draw call sites)

**Interfaces:**
- Consumes: `useGameStore` (`draw`, `currentNumber` via `getState`), `useSettingsStore` (`ttsEnabled`), `sound.speak`, `sound.langFromLocale`, `Theme`.
- Produces: `useDrawWithSound(theme: Theme): () => void` — a stable callback that draws, then (if TTS is on) speaks the just-drawn number's phrase.

Rationale: gating in the event handler (not a `useEffect` on `drawSeq`) means undo never speaks and a resume that jumps `drawSeq` never speaks — only a real draw does. It also avoids StrictMode double-speak, since handlers aren't double-invoked.

- [ ] **Step 1: Implement the hook**

Create `src/useDrawWithSound.ts`:

```ts
// Composes gameStore.draw with the sound module: draw, then voice the phrase of
// the number that draw just produced — but only when the host has TTS on. Read
// from the store's getState() right after draw() so we get the fresh number
// synchronously (zustand set is synchronous). Host-only.

import { useCallback } from 'react'
import { useGameStore } from './store/gameStore'
import { useSettingsStore } from './store/settingsStore'
import { speak, langFromLocale } from './sound'
import type { Theme } from './themes/types'

export function useDrawWithSound(theme: Theme): () => void {
  const draw = useGameStore((s) => s.draw)

  return useCallback(() => {
    draw()
    // Read TTS live (not via a subscription) so this callback stays stable and
    // the handler always sees the current preference.
    if (!useSettingsStore.getState().ttsEnabled) return
    const number = useGameStore.getState().currentNumber
    if (number === null) return
    const call = theme.calls[String(number)]
    if (!call) return
    speak(call.phrase, { lang: langFromLocale(theme.locale), audioUrl: call.audio })
  }, [draw, theme])
}
```

- [ ] **Step 2: Wire into `App.tsx`**

In `src/App.tsx`, add the import:

```ts
import { useDrawWithSound } from './useDrawWithSound'
```

Replace the `draw` selector usage for the button. Currently:

```ts
  const draw = useGameStore((s) => s.draw)
```

Keep that line (other code may reference it — check; if only `DrawButton` uses it, you may remove it). Add, after `theme` is resolved (it is defined at `const theme = themes.find(...)`):

```ts
  const drawWithSound = useDrawWithSound(theme)
```

Then change the footer's draw button from `onDraw={draw}` to `onDraw={drawWithSound}`:

```tsx
        <DrawButton onDraw={drawWithSound} disabled={gameOver} />
```

If `draw` is now unused, remove its selector line (lint `noUnusedLocals` will flag it).

- [ ] **Step 3: Wire into `DisplayMode.tsx`**

In `src/components/DisplayMode.tsx`, add the import:

```ts
import { useDrawWithSound } from '../useDrawWithSound'
```

`DisplayMode` receives `theme` as a prop. After the existing `const draw = useGameStore((s) => s.draw)` (line ~160), add:

```ts
  const drawWithSound = useDrawWithSound(theme)
```

Replace the three `draw()` call sites (the keydown handler ~line 176, the game-over-guarded click ~line 232) with `drawWithSound()`. Update the keydown effect's dependency array from `[draw, undo]` to `[drawWithSound, undo]`. If `draw` becomes unused, remove its selector line.

- [ ] **Step 4: Verify build + lint + tests**

Run: `npm test && npm run build && npm run lint`
Expected: green, no unused-locals errors.

- [ ] **Step 5: Manual browser check**

Run: `npm run dev` (or the preview_start dev server). In the host screen: with TTS off (default) drawing is silent. Open devtools console and run `localStorage.setItem('tambola:host:settings', JSON.stringify({ttsEnabled:true,reducedMotion:false}))`, reload, draw — the browser speaks the phrase. Undo speaks nothing. (Settings UI arrives in Task 6; this is a temporary manual flip.)

- [ ] **Step 6: Commit**

```bash
git add src/useDrawWithSound.ts src/App.tsx src/components/DisplayMode.tsx
git commit -m "feat(sound): speak the drawn phrase on draw (host + display), TTS-gated"
```

---

### Task 4: `useWakeLock` — keep the host screen awake

**Files:**
- Create: `src/useWakeLock.ts`
- Modify: `src/App.tsx` (call the hook), `src/components/DisplayMode.tsx` (call the hook)

**Interfaces:**
- Produces: `useWakeLock(): void` — acquires a screen wake lock on mount, re-acquires on visibility regain, releases on unmount. Silent no-op where unsupported.

- [ ] **Step 1: Implement the hook**

Create `src/useWakeLock.ts`:

```ts
// Holds a screen wake lock while a host surface is mounted, so the caller's
// phone (or the cast stage) doesn't sleep mid-game. Host-only.
//
// The browser auto-releases the lock whenever the tab is hidden, so we re-acquire
// on visibilitychange. Fully feature-detected: on a browser without the API
// (older iOS Safari) every call is a silent no-op.

import { useEffect } from 'react'

export function useWakeLock(): void {
  useEffect(() => {
    // navigator.wakeLock is not in every lib.dom; guard and narrow.
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> }
    }
    if (!nav.wakeLock) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        sentinel = await nav.wakeLock!.request('screen')
      } catch {
        // Denied (e.g. tab not visible/focused) — nothing to do; a later
        // visibilitychange will retry.
      }
    }

    const onVisibility = () => {
      // Re-acquire when the tab becomes visible again (the OS dropped the lock
      // while hidden). Guard against acquiring after unmount.
      if (!cancelled && document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void sentinel?.release().catch(() => {})
      sentinel = null
    }
  }, [])
}
```

Note on types: `WakeLockSentinel` ships in TypeScript's DOM lib. If `tsc -b` reports it missing in this environment, add `"dom.iterable"` is not needed; instead declare a minimal local type. Verify in Step 2 first.

- [ ] **Step 2: Wire into `App.tsx` and `DisplayMode.tsx`**

In `src/App.tsx`, import and call inside `App()` (near the top of the component body, before the early returns is fine — hooks must run unconditionally, so place it as the very first hook call):

```ts
import { useWakeLock } from './useWakeLock'
// ...inside App(), as the first line of the component body:
  useWakeLock()
```

In `src/components/DisplayMode.tsx`, import and call as the first hook in the component:

```ts
import { useWakeLock } from '../useWakeLock'
// ...inside DisplayMode(), first hook line:
  useWakeLock()
```

- [ ] **Step 3: Verify build + lint + tests**

Run: `npm test && npm run build && npm run lint`
Expected: green. If `WakeLockSentinel` / `navigator.wakeLock` typecheck fails, add this above the hook in `useWakeLock.ts` and re-run:

```ts
// Minimal shims if the DOM lib in use lacks Wake Lock types.
// (Only add if the build complains — modern TS DOM lib already has these.)
```

Then replace the `nav.wakeLock` cast with a locally-declared interface as needed.

- [ ] **Step 4: Manual browser check**

Run the dev server on a phone (LAN) or desktop. On a supported browser the screen should not dim while the host page is open. In devtools, `navigator.wakeLock` exists on Chromium; confirm no console errors on mount, tab-switch away and back (re-acquire), and navigate away (release).

- [ ] **Step 5: Commit**

```bash
git add src/useWakeLock.ts src/App.tsx src/components/DisplayMode.tsx
git commit -m "feat(wakelock): hold a screen wake lock while a host surface is mounted"
```

---

### Task 5: Reduce-motion setting → apply in `DisplayMode`

**Files:**
- Create: `src/useReducedMotionSetting.ts`
- Modify: `src/components/DisplayMode.tsx` (swap the raw `useReducedMotion` for the combined hook)

**Interfaces:**
- Consumes: motion's `useReducedMotion`, `useSettingsStore` (`reducedMotion`).
- Produces: `useReducedMotionSetting(): boolean` — `true` if the OS asks for reduced motion OR the user toggled it on.

Note: `DisplayMode` is the app's only animation gate (`NumberDisplay` has no motion). So this hook is applied there and nowhere else.

- [ ] **Step 1: Implement the hook**

Create `src/useReducedMotionSetting.ts`:

```ts
// The effective "reduce motion" signal: the OS preference OR the host's own
// toggle. It can only ADD reduction — a user who wants motion still gets none if
// the OS asks for none. Host-only.

import { useReducedMotion } from 'motion/react'
import { useSettingsStore } from './store/settingsStore'

export function useReducedMotionSetting(): boolean {
  const system = useReducedMotion() // OS "prefers-reduced-motion"
  const user = useSettingsStore((s) => s.reducedMotion)
  return Boolean(system) || user
}
```

- [ ] **Step 2: Swap it into `DisplayMode.tsx`**

In `src/components/DisplayMode.tsx`:
- Change the import `import { motion, useReducedMotion } from 'motion/react'` to `import { motion } from 'motion/react'`.
- Add `import { useReducedMotionSetting } from '../useReducedMotionSetting'`.
- Replace `const reducedMotion = useReducedMotion()` (line ~163) with `const reducedMotion = useReducedMotionSetting()`.

- [ ] **Step 3: Verify build + lint + tests**

Run: `npm test && npm run build && npm run lint`
Expected: green, no unused import of `useReducedMotion`.

- [ ] **Step 4: Manual browser check**

Open the stage (`/?display=1`). With the reduce-motion setting off and OS motion normal, the number's spring entrance plays. Flip the setting on (via Task 6 UI, or temporarily via `localStorage` + reload) — the entrance becomes instant. Restore.

- [ ] **Step 5: Commit**

```bash
git add src/useReducedMotionSetting.ts src/components/DisplayMode.tsx
git commit -m "feat(settings): reduce-motion toggle ORs with the OS preference"
```

---

### Task 6: Settings sheet + header gear (moves the theme picker in)

**Files:**
- Create: `src/components/SettingsSheet.tsx`
- Modify: `src/App.tsx` (panel state gains `'settings'`; header swaps the inline `ThemePicker` for a gear button; render the sheet)

**Interfaces:**
- Consumes: `ThemePicker`, `useSettingsStore` (`ttsEnabled`, `reducedMotion`, setters), `Theme[]`.
- Produces: `SettingsSheet` component:
  ```ts
  interface SettingsSheetProps {
    themes: Theme[]
    currentThemeId: string
    onChangeTheme: (id: string) => void
    onClose: () => void
  }
  ```

- [ ] **Step 1: Implement `SettingsSheet.tsx`**

Create `src/components/SettingsSheet.tsx` (matches the full-screen host-panel pattern used by `TicketsPanel`/`VerifierPanel` — a fixed cover with a close control):

```tsx
// The host's settings: theme, spoken numbers (TTS), reduce motion. A full-screen
// panel like Tickets / Check — the host does one thing at a time. Host-only.

import type { Theme } from '../themes/types'
import { ThemePicker } from './ThemePicker'
import { useSettingsStore } from '../store/settingsStore'

interface SettingsSheetProps {
  themes: Theme[]
  currentThemeId: string
  onChangeTheme: (id: string) => void
  onClose: () => void
}

// A plain labelled on/off switch — no new dependency, just a styled checkbox.
function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3">
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className="text-xs text-white/50">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 accent-amber-400"
      />
    </label>
  )
}

export function SettingsSheet({
  themes,
  currentThemeId,
  onChangeTheme,
  onClose,
}: SettingsSheetProps) {
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const setTtsEnabled = useSettingsStore((s) => s.setTtsEnabled)
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion)

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-neutral-950 text-white">
      <header className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-bold">Settings</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-semibold"
        >
          Done
        </button>
      </header>

      <div className="flex flex-col gap-2 px-4">
        <div className="py-3">
          <div className="mb-2 text-sm font-semibold text-white">Theme</div>
          <ThemePicker themes={themes} currentId={currentThemeId} onChange={onChangeTheme} />
        </div>

        <div className="h-px bg-white/10" />

        <Toggle
          label="Speak numbers"
          hint="Say each number's phrase aloud when you draw it."
          checked={ttsEnabled}
          onChange={setTtsEnabled}
        />

        <div className="h-px bg-white/10" />

        <Toggle
          label="Reduce motion"
          hint="Skip animations on the room display."
          checked={reducedMotion}
          onChange={setReducedMotion}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into `App.tsx`**

In `src/App.tsx`:
- Add `import { SettingsSheet } from './components/SettingsSheet'`.
- Widen the panel state type: change `useState<'tickets' | 'verify' | null>(null)` to `useState<'tickets' | 'verify' | 'settings' | null>(null)`.
- Remove the inline `<ThemePicker ... />` from the header and remove the now-unused `import { ThemePicker }` line.
- In the header, add a gear button (place it before the Tickets button). Use a plain unicode gear so no icon dependency is added:

```tsx
          <button
            type="button"
            onClick={() => setPanel('settings')}
            aria-label="Settings"
            className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-semibold"
          >
            ⚙
          </button>
```

- Render the sheet alongside the other panels (near the `panel === 'verify'` block):

```tsx
      {panel === 'settings' && (
        <SettingsSheet
          themes={themes}
          currentThemeId={themeId}
          onChangeTheme={setThemeId}
          onClose={() => setPanel(null)}
        />
      )}
```

- [ ] **Step 3: Verify build + lint + tests**

Run: `npm test && npm run build && npm run lint`
Expected: green. Confirm the header no longer imports/uses `ThemePicker` directly (it's now only used inside `SettingsSheet`).

- [ ] **Step 4: Manual browser check**

Run the dev server. Header shows a ⚙ button; the inline theme dropdown is gone. Tap ⚙ → sheet opens with Theme picker + two toggles. Flip "Speak numbers" on, Done, draw → phrase is spoken. Flip "Reduce motion" on, open `/?display=1`, draw → no entrance animation. Reload → both toggles retain their state (persistence). Switch theme in the sheet → phrases change, draw order unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsSheet.tsx src/App.tsx
git commit -m "feat(settings): settings sheet (theme, TTS, reduce motion) behind a header gear"
```

---

### Task 7: PWA — installable, offline, owned precache SW + airgap assertion

**Files:**
- Modify: `package.json` (dev deps), `vite.config.ts`, `index.html`, `tsconfig.app.json` (exclude the SW), `src/main.tsx` (register), `public/` (icons; delete dead `icons.svg`)
- Create: `src/sw.ts`, `src/vite-env.d.ts`, `public/app-icon.svg`, `pwa-assets.config.ts`, generated icon PNGs
- Test: `src/player/airgap.test.ts` (ADD one assertion — the SW no-relay check)

**Interfaces:**
- Consumes: `virtual:pwa-register` (from vite-plugin-pwa), `workbox-precaching`.
- Produces: a registered precache-only service worker; a web app manifest; installable icons.

- [ ] **Step 1: Install dependencies**

```bash
npm install -D vite-plugin-pwa workbox-build workbox-window workbox-precaching @vite-pwa/assets-generator
```

Expected: installs cleanly (vite-plugin-pwa 1.3 lists Vite 8 in its peer range). If npm reports a peer conflict, re-run with `--legacy-peer-deps` and note it in the commit body.

- [ ] **Step 2: Create the original app icon**

Create `public/app-icon.svg` (dark rounded tile + a saffron "90" built from strokes, so it rasterizes without any font dependency — original geometry, no third-party IP):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0a0a0a"/>
  <rect x="28" y="28" width="456" height="456" rx="88" fill="#171717"/>
  <!-- "9": a ring with a downward tail -->
  <circle cx="196" cy="214" r="60" fill="none" stroke="#FF9933" stroke-width="40"/>
  <path d="M244 244 Q262 342 196 396" fill="none" stroke="#FF9933" stroke-width="40" stroke-linecap="round"/>
  <!-- "0": a ring -->
  <circle cx="332" cy="300" r="72" fill="none" stroke="#FF9933" stroke-width="42"/>
</svg>
```

(The look is easy to change later — swap this SVG and re-run Step 4. The tile stays legible at 48px.)

- [ ] **Step 3: Configure the assets generator**

Create `pwa-assets.config.ts` at the repo root:

```ts
import { defineConfig, minimalPreset } from '@vite-pwa/assets-generator/config'

// Generates the icon set (192/512/maskable + apple-touch) from one source SVG.
export default defineConfig({
  preset: minimalPreset,
  images: ['public/app-icon.svg'],
})
```

- [ ] **Step 4: Generate the icons**

```bash
npx pwa-assets-generator
```

Expected: writes into `public/` — `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`. Open `public/pwa-192x192.png` and confirm the saffron "90" is visible on the dark tile. If any file name differs, use the actual generated names in Steps 6–7.

- [ ] **Step 5: Delete dead scaffold + replace favicon**

```bash
git rm public/icons.svg
```

`public/favicon.svg` is the old Vite/Claude scaffold glyph. Replace it by copying the new source: overwrite `public/favicon.svg` with the contents of `public/app-icon.svg` (same original mark). (Keep the filename so `index.html`'s existing `<link rel="icon">` still resolves; it's updated in Step 8 anyway.)

- [ ] **Step 6: Write the precache-only service worker**

Create `src/sw.ts`:

```ts
/// <reference lib="webworker" />
//
// THE AIRGAP — SERVICE WORKER INVARIANT.
//
// This worker exists for ONE reason: serve the app's own static files from cache
// so the host (and a scanned /t ticket) work offline. That is the same set of
// files the browser would fetch anyway — no game state passes through here.
//
// It MUST NEVER relay messages between clients. Specifically: no clients.matchAll(),
// no clients.get(), and no postMessage() to any client. The service worker controls
// both the host tab and the /t tab; forwarding a message from one to the other would
// be a channel from the caller into the player's ticket — exactly what THE AIRGAP
// forbids. Registration lives in a file (main.tsx); the guarantee lives HERE, in the
// absence of any relay code. src/player/airgap.test.ts asserts that absence.
//
// Precache only. Nothing else belongs in this file.

import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

precacheAndRoute(self.__WB_MANIFEST)
```

- [ ] **Step 7: Keep the SW out of the app's tsc project**

The SW uses the WebWorker lib; the app project uses the DOM lib. Compiling both together clashes, and `vite-plugin-pwa` compiles `sw.ts` itself. Exclude it from `tsconfig.app.json`:

Change the `exclude` line in `tsconfig.app.json`:

```json
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/sw.ts"]
```

- [ ] **Step 8: Configure `vite-plugin-pwa`**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // We own the service worker (src/sw.ts) so the airgap "no client relay"
      // invariant is asserted against source we control, not a generated file.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        // Everything is local, so precaching every built asset == full offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
      },
      manifest: {
        name: 'Tambola Host',
        short_name: 'Tambola',
        description: 'A themed number-caller for a human tambola host.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
```

- [ ] **Step 9: Add PWA client types**

Create `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

- [ ] **Step 10: Register the SW in `main.tsx`**

`src/main.tsx` is NOT walked by the airgap test (it walks from `PlayerApp.tsx` and `App.tsx`). Registering here covers both routes, so a scanned `/t` ticket also works offline. Add near the top of `src/main.tsx`, after the existing imports:

```ts
import { registerSW } from 'virtual:pwa-register'

// Register the precache service worker for both routes. It only serves cached
// static files — see src/sw.ts for the airgap invariant it upholds. autoUpdate
// means a new deploy refreshes the cache with no prompt. Feature-detected by the
// helper; a no-op where service workers are unavailable.
registerSW({ immediate: true })
```

- [ ] **Step 11: Update `index.html` head**

In `index.html`, inside `<head>`, replace the existing `<link rel="icon" ...>` and `<title>` and add the apple/theme meta:

```html
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
    <meta name="theme-color" content="#0a0a0a" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Tambola" />
    <title>Tambola Host</title>
```

- [ ] **Step 12: Add the airgap SW no-relay assertion**

In `src/player/airgap.test.ts`, add ONE new `it` inside the existing
`describe('THE AIRGAP: the host cannot reach into the player', ...)` block (it is
about host→player leakage, which is exactly what an SW relay would be). Do not
modify any existing assertion. Add after the `does not statically import the
player screen` test:

```ts
  it('ships a precache-only service worker that relays nothing between clients', () => {
    // The real PWA airgap invariant is NOT "which file calls register()" — it's
    // that the service worker (which controls BOTH the host tab and /t) can never
    // forward a message from one client to another. If it could, that is a channel
    // from the caller into the player's ticket. So the SW source must contain no
    // client enumeration and no postMessage to a client.
    const swPath = resolve(SRC, 'sw.ts')
    const sw = readFileSync(swPath, 'utf8').replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '') // strip comments
    for (const relay of [/clients\s*\.\s*matchAll/, /clients\s*\.\s*get\b/, /\.postMessage\s*\(/]) {
      expect(
        relay.test(sw),
        `src/sw.ts matches ${relay} — the service worker must not relay between clients`,
      ).toBe(false)
    }
  })
```

- [ ] **Step 13: Run the full suite (airgap included)**

Run: `npm test`
Expected: all green, including the new SW assertion AND every existing airgap assertion unchanged.

- [ ] **Step 14: Build and preview**

Run: `npm run build`
Expected: build succeeds; `dist/` contains `sw.js`, `manifest.webmanifest`, and the icon PNGs. Then:

Run: `npm run preview`
In the browser: devtools → Application → Manifest shows "Tambola Host" with icons; Application → Service Workers shows an activated worker. An install/Add-to-Home affordance is offered. Toggle offline in devtools and reload both `/` and `/t#<some-id>` — both still render.

- [ ] **Step 15: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 16: Commit**

```bash
git add package.json package-lock.json vite.config.ts index.html tsconfig.app.json src/main.tsx src/sw.ts src/vite-env.d.ts pwa-assets.config.ts public/ src/player/airgap.test.ts
git commit -m "feat(pwa): installable, offline; owned precache SW with airgap no-relay assertion"
```

---

### Task 8: Update PROGRESS.md

**Files:**
- Modify: `PROGRESS.md`

- [ ] **Step 1: Record Phase 9**

Add a `**Phase 9 — PWA, wake lock, sound, settings**` block under `## Done`, summarizing: installable/offline PWA via injectManifest with an owned precache-only `src/sw.ts` (airgap no-relay assertion added); `useWakeLock`; `sound.ts` (clip-or-TTS) wired on draw via `useDrawWithSound`; `settingsStore` + `SettingsSheet` (theme moved in, TTS + reduce-motion); reduce-motion ORs the OS pref in `DisplayMode`. Note the new `tambola:host:settings` key and that THE AIRGAP held (existing assertions unchanged, one added). Remove nothing from "Not started" that wasn't done (the remaining items — display remote channel, book-of-6 — stay).

- [ ] **Step 2: Commit**

```bash
git add PROGRESS.md
git commit -m "docs: record Phase 9 (PWA, wake lock, sound, settings) in PROGRESS.md"
```

---

## Self-Review notes

- **Spec coverage:** PWA install/offline (Task 7), owned precache SW + no-relay assertion (Task 7 steps 6/12), icons + minimal iOS (Task 7 steps 2–5, 11), wake lock (Task 4), sound clip-or-TTS + preload + lang derivation (Tasks 2–3), settings store + sheet + gear + theme-move (Tasks 1, 6), reduce-motion OR (Task 5), no analytics/accounts (nothing added). All covered.
- **Airgap:** only `sw.ts` (compiled by the plugin, imported by no app file) and `main.tsx` (not walked) gain SW code; the added assertion strengthens, not weakens, the suite. `settingsStore`/`sound`/`useWakeLock`/`useDrawWithSound`/`useReducedMotionSetting`/`SettingsSheet` are reachable only from host entries.
- **Type consistency:** `PersistedSettings` (persist.ts) === store field names (`ttsEnabled`, `reducedMotion`); `speak(text, {lang, audioUrl})` used exactly so in `useDrawWithSound`; `langFromLocale` signature stable across Tasks 2–3; `SettingsSheetProps` matches the `App.tsx` render call.
- **Known environmental risk:** vite-plugin-pwa on Vite 8 is new; Task 7 Step 1 has the `--legacy-peer-deps` fallback. `WakeLockSentinel` DOM types (Task 4) and asset-generator output filenames (Task 7 Step 4) each have an in-step verification + fallback.
