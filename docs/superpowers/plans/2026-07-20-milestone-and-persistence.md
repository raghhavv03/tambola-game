# Milestone Trigger + Host Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a theme's milestone phrase in VerifierPanel on a VALID ruling, and persist the host's caller (seed + history) and bogey tally to localStorage so a refresh doesn't lose the game.

**Architecture:** Milestone phrases are read directly from the existing `theme.milestones` map inside VerifierPanel's own local state — no new store field, no new component. Persistence is layered: a pure `replayCaller()` in the engine reconstructs-and-verifies a caller from seed+history; a thin `persist.ts` wraps `localStorage`; `gameStore`/`claimStore` each autosave on their own mutations and expose a `loadSaved*`/`saveFailed` surface; a single `gameSession.ts` orchestrator is the only code path allowed to touch both stores together for resume/new-game, so the two can never drift out of sync.

**Tech Stack:** Vite + React 19 + TypeScript, zustand, Vitest (node environment, no DOM/testing-library — component changes are verified by build/lint/manual browser check, matching the existing project convention where components have no unit tests).

## Global Constraints

- Governing spec: `docs/superpowers/specs/2026-07-20-milestone-and-persistence-design.md` — follow it exactly, do not redesign in-flight.
- THE AIRGAP: no new file may be reachable from `src/player/PlayerApp.tsx`, and no host file may name the `tambola:marks:` string. `src/player/airgap.test.ts` must pass **unmodified**.
- New persistence keys: `tambola:host:game`, `tambola:host:bogeys` — never the player's `tambola:marks:` prefix.
- No new animation import, no new reaction-layer component (Phase 4 removal stays removed).
- `VerifierPanel`'s milestone banner reuses the `text-amber-200` phrase-text convention already used in `src/components/NumberDisplay.tsx`.
- Reads from persistence (`loadGame`/`loadBogeys`) degrade **silently** to "nothing found" on any parse/shape failure. Writes (`saveGame`/`saveBogeys`) return `boolean` and `console.warn` on failure — never silently swallowed, never thrown.
- `resumeGame`/`startNewGame` in `src/store/gameSession.ts` are the only call sites allowed to touch both `gameStore` and `claimStore` together; no other code duplicates "start over" or "resume" logic.
- Run `npm test`, `npm run build`, `npm run lint` clean before considering any task done that touches shared modules; run the full suite again at the end.

---

### Task 1: `engine/caller.ts` — expose `seed`, add `replayCaller`

**Files:**
- Modify: `src/engine/caller.ts`
- Test: `src/engine/caller.test.ts`

**Interfaces:**
- Produces: `Caller.seed: number` (readonly, already-resolved seed — passed in or generated). `replayCaller(seed: number, history: number[]): Caller | null` — pure function, no imports beyond `createCaller` itself.
- Consumes: nothing new.

- [ ] **Step 1: Write the failing tests**

Append to `src/engine/caller.test.ts` (keep the existing `SEED = 42` constant and import line, add `replayCaller` to the import):

```ts
import { describe, it, expect } from 'vitest'
import { createCaller, replayCaller } from './caller'
```

Add a new `describe` block at the end of the file:

```ts
describe('caller.seed', () => {
  it('exposes the seed a caller was built from', () => {
    const caller = createCaller(123)
    expect(caller.seed).toBe(123)
  })

  it('exposes a generated seed when none is given', () => {
    const caller = createCaller()
    expect(typeof caller.seed).toBe('number')
  })
})

describe('replayCaller', () => {
  it('reconstructs the exact state after N draws', () => {
    const N = 17
    const reference = createCaller(SEED)
    const history: number[] = []
    for (let i = 0; i < N; i++) history.push(reference.draw() as number)

    const replayed = replayCaller(SEED, history)
    expect(replayed).not.toBeNull()
    expect(replayed!.history).toEqual(reference.history)
    expect(replayed!.remaining).toEqual(reference.remaining)
    expect([...replayed!.called]).toEqual([...reference.called])
  })

  it('reconstructs correctly after an undo (shorter history)', () => {
    const reference = createCaller(SEED)
    for (let i = 0; i < 10; i++) reference.draw()
    reference.undo() // net 9 draws

    const replayed = replayCaller(SEED, reference.history)
    expect(replayed).not.toBeNull()
    expect(replayed!.history).toEqual(reference.history)
    expect(replayed!.history.length).toBe(9)
  })

  it('returns null when the history does not match a replay from that seed', () => {
    const tampered = [1, 2, 3, 4, 5]
    const real = createCaller(SEED)
    for (let i = 0; i < 5; i++) real.draw()
    // Guard against a coincidental match breaking this test.
    expect(tampered).not.toEqual(real.history)
    expect(replayCaller(SEED, tampered)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- caller.test.ts`
Expected: FAIL — `caller.seed` is `undefined` and `replayCaller` is not exported.

- [ ] **Step 3: Implement**

In `src/engine/caller.ts`, add `seed` to the `Caller` interface (after the `called` getter doc):

```ts
export interface Caller {
  /** Draw the next number. Returns it, or null once all 90 are gone. */
  draw(): number | null
  /** Undo the most recent draw, returning that number to the pool. No-op if nothing
   *  has been drawn yet. Returns the number it put back, or null if there was none. */
  undo(): number | null
  /** Wipe all draws and start over from a full pool (same shuffle order). */
  reset(): void
  /** Numbers drawn so far, in the order they came out (oldest first). */
  readonly history: number[]
  /** Numbers not yet drawn, in the order they will come out. */
  readonly remaining: number[]
  /** The drawn numbers as a Set — handy for "has this been called?" checks. */
  readonly called: Set<number>
  /** The seed this caller's shuffle order was built from — the value actually
   *  used, whether passed in or generated. Needed to persist and later
   *  reconstruct the exact same draw order (see replayCaller below). */
  readonly seed: number
}
```

In `createCaller`'s returned object, add `seed: actualSeed,` (e.g. right after the `reset()` method, before the getters):

```ts
    reset() {
      drawn = 0 // same `order`, back to the start — a full pool again
    },

    seed: actualSeed,

    // Getters (not stored arrays) so each read reflects the current `drawn` pointer.
```

At the end of the file, after `createCaller`, add:

```ts
/**
 * Rebuild a caller from a persisted seed + history, and verify the replay
 * actually reproduces that history before anything trusts it.
 *
 * Persisted state is never applied directly (no `new Set(savedHistory)`) — it
 * is REPLAYED through draw(), the same path a live game uses, so the
 * reconstructed caller's internal `drawn` pointer ends up exactly where undo()
 * expects it. The deep-equal check catches the one thing that would make
 * blind replay unsafe: a persisted history that this build's shuffle no
 * longer reproduces from that seed (e.g. rng.ts changed).
 *
 * @returns the reconstructed Caller if the replay matches, or null if it
 *          diverged — treat null like corrupt data, never resume from it.
 */
export function replayCaller(seed: number, history: number[]): Caller | null {
  const caller = createCaller(seed)
  for (let i = 0; i < history.length; i++) caller.draw()

  const replayed = caller.history
  const matches =
    replayed.length === history.length &&
    replayed.every((n, i) => n === history[i])

  return matches ? caller : null
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- caller.test.ts`
Expected: PASS, all cases including the new ones.

- [ ] **Step 5: Commit**

```bash
git add src/engine/caller.ts src/engine/caller.test.ts
git commit -m "$(cat <<'EOF'
Expose Caller.seed and add replayCaller for persistence

seed lets a caller's exact shuffle be persisted; replayCaller rebuilds
one from seed + history and verifies the replay before it's trusted,
rather than reconstructing the Set/array directly.
EOF
)"
```

---

### Task 2: localStorage layer — `persist.ts` + test mock

**Files:**
- Create: `src/test/mockLocalStorage.ts`
- Create: `src/store/persist.ts`
- Create: `src/store/persist.test.ts`

**Interfaces:**
- Produces:
  - `installMockLocalStorage(): MockLocalStorage` with `{ getItem, setItem, removeItem, failNextWrite() }` — stubs `window.localStorage` for tests.
  - `PersistedGame { seed: number; history: number[]; savedAt: number }`
  - `saveGame(seed: number, history: number[]): boolean`
  - `loadGame(): PersistedGame | null`
  - `clearGame(): void`
  - `saveBogeys(bogeys: Record<string, number>): boolean`
  - `loadBogeys(): Record<string, number>`
  - `clearBogeys(): void`
- Consumes: nothing (this is the storage floor).

- [ ] **Step 1: Write the test mock (not itself tested — it's test infrastructure)**

Create `src/test/mockLocalStorage.ts`:

```ts
// Shared localStorage stub for store tests. Vitest's node environment has no
// global `window`/`localStorage` (unlike a browser), and persist.ts (like
// player/marks.ts before it) reads `window.localStorage` directly, so tests
// stub `window` itself rather than mocking a module.

import { vi } from 'vitest'

export interface MockLocalStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  /** Force the next write to throw, simulating full/blocked storage. */
  failNextWrite(): void
}

export function installMockLocalStorage(): MockLocalStorage {
  const data = new Map<string, string>()
  let shouldFailNextWrite = false

  const store: MockLocalStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      if (shouldFailNextWrite) {
        shouldFailNextWrite = false
        throw new Error('storage full (simulated)')
      }
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
    failNextWrite: () => {
      shouldFailNextWrite = true
    },
  }

  vi.stubGlobal('window', { localStorage: store })
  return store
}
```

- [ ] **Step 2: Write the failing test**

Create `src/store/persist.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { installMockLocalStorage, type MockLocalStorage } from '../test/mockLocalStorage'
import {
  saveGame,
  loadGame,
  clearGame,
  saveBogeys,
  loadBogeys,
  clearBogeys,
} from './persist'

let store: MockLocalStorage

beforeEach(() => {
  store = installMockLocalStorage()
})

describe('game persistence', () => {
  it('round-trips seed + history', () => {
    expect(saveGame(42, [7, 3, 9])).toBe(true)
    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.seed).toBe(42)
    expect(loaded!.history).toEqual([7, 3, 9])
    expect(typeof loaded!.savedAt).toBe('number')
  })

  it('loadGame returns null when nothing was saved', () => {
    expect(loadGame()).toBeNull()
  })

  it('loadGame returns null on malformed JSON', () => {
    store.setItem('tambola:host:game', '{not json')
    expect(loadGame()).toBeNull()
  })

  it('loadGame returns null when the shape is wrong', () => {
    store.setItem('tambola:host:game', JSON.stringify({ foo: 'bar' }))
    expect(loadGame()).toBeNull()
  })

  it('clearGame removes the saved game', () => {
    saveGame(1, [1])
    clearGame()
    expect(loadGame()).toBeNull()
  })

  it('saveGame returns false and warns when storage throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    store.failNextWrite()
    expect(saveGame(1, [1])).toBe(false)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('bogey persistence', () => {
  it('round-trips the tally', () => {
    expect(saveBogeys({ 'K3P9Z-04': 2 })).toBe(true)
    expect(loadBogeys()).toEqual({ 'K3P9Z-04': 2 })
  })

  it('loadBogeys returns {} when nothing was saved', () => {
    expect(loadBogeys()).toEqual({})
  })

  it('clearBogeys removes the saved tally', () => {
    saveBogeys({ X: 1 })
    clearBogeys()
    expect(loadBogeys()).toEqual({})
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- persist.test.ts`
Expected: FAIL — `src/store/persist.ts` doesn't exist yet.

- [ ] **Step 4: Implement**

Create `src/store/persist.ts`:

```ts
// localStorage persistence for HOST-ONLY game state — the caller's seed +
// draw history, and the bogey tally. Keys use the `tambola:host:` prefix,
// disjoint from the player's `tambola:marks:` prefix (src/player/marks.ts):
// airgap.test.ts asserts no file reachable from the host entry point names
// that OTHER prefix, and this module is never imported under src/player/.
//
// Reads degrade silently to "nothing found" on any parse failure — same as
// marks.ts's precedent, because a host whose storage is blocked should still
// get a working (if unsaved) game.
//
// Writes are different: losing draw history mid-party is a bigger deal than
// losing a player's tap-marks, so a failed write is reported back (boolean)
// rather than swallowed, and warns to the console. The caller (gameStore /
// claimStore) decides how to surface that to the host.

const GAME_KEY = 'tambola:host:game'
const BOGEYS_KEY = 'tambola:host:bogeys'

export interface PersistedGame {
  seed: number
  history: number[]
  savedAt: number
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJSON(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    console.warn(`tambola: failed to save "${key}" to localStorage`, err)
    return false
  }
}

export function saveGame(seed: number, history: number[]): boolean {
  const game: PersistedGame = { seed, history, savedAt: Date.now() }
  return writeJSON(GAME_KEY, game)
}

export function loadGame(): PersistedGame | null {
  const parsed = readJSON<PersistedGame>(GAME_KEY)
  if (parsed === null) return null
  if (typeof parsed.seed !== 'number' || !Array.isArray(parsed.history)) {
    return null // shape doesn't match what we ever wrote — treat as absent
  }
  return parsed
}

export function clearGame(): void {
  try {
    window.localStorage.removeItem(GAME_KEY)
  } catch {
    // Nothing to do — if storage is blocked there was nothing persisted anyway.
  }
}

export function saveBogeys(bogeys: Record<string, number>): boolean {
  return writeJSON(BOGEYS_KEY, bogeys)
}

export function loadBogeys(): Record<string, number> {
  return readJSON<Record<string, number>>(BOGEYS_KEY) ?? {}
}

export function clearBogeys(): void {
  try {
    window.localStorage.removeItem(BOGEYS_KEY)
  } catch {
    // Nothing to do — see clearGame().
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- persist.test.ts`
Expected: PASS, all cases.

- [ ] **Step 6: Commit**

```bash
git add src/test/mockLocalStorage.ts src/store/persist.ts src/store/persist.test.ts
git commit -m "$(cat <<'EOF'
Add localStorage persistence layer for host game state

tambola:host:game and tambola:host:bogeys keys, disjoint from the
player's tambola:marks: prefix. Reads degrade silently to "nothing
found"; writes report failure via a boolean + console.warn instead of
swallowing it, since losing draw history mid-party matters more than
losing a player's tap-marks.
EOF
)"
```

---

### Task 3: `gameStore.ts` — autosave, `loadSavedGame`, `newGame`

**Files:**
- Modify: `src/store/gameStore.ts`
- Test: `src/store/gameStore.test.ts` (new)

**Interfaces:**
- Consumes: `createCaller`, `replayCaller` from `../engine/caller` (Task 1); `saveGame`, `clearGame` from `./persist` (Task 2).
- Produces: `GameState.seed: number`, `GameState.saveFailed: boolean`, `GameState.loadSavedGame(seed: number, history: number[]): boolean`, `GameState.newGame(): void`. Consumed by Task 5 (`gameSession.ts`) and Task 8 (`App.tsx`).

- [ ] **Step 1: Write the failing test**

Create `src/store/gameStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { installMockLocalStorage } from '../test/mockLocalStorage'
import { useGameStore } from './gameStore'
import { createCaller } from '../engine/caller'

beforeEach(() => {
  installMockLocalStorage()
  useGameStore.getState().newGame() // fresh caller + reset fields before each test
})

describe('gameStore', () => {
  it('draw advances history and called, and autosaves without failing', () => {
    useGameStore.getState().draw()
    useGameStore.getState().draw()
    const state = useGameStore.getState()
    expect(state.history.length).toBe(2)
    expect(state.called.size).toBe(2)
    expect(state.currentNumber).toBe(state.history[1])
    expect(state.saveFailed).toBe(false)
  })

  it('loadSavedGame reconstructs exact state after N draws', () => {
    const reference = createCaller(99)
    const history: number[] = []
    for (let i = 0; i < 12; i++) history.push(reference.draw() as number)

    const ok = useGameStore.getState().loadSavedGame(99, history)
    expect(ok).toBe(true)

    const state = useGameStore.getState()
    expect(state.history).toEqual(reference.history)
    expect([...state.called]).toEqual([...reference.called])
    expect(state.currentNumber).toBe(history[history.length - 1])
    expect(state.drawSeq).toBe(12)
  })

  it('loadSavedGame reconstructs correctly after an undo', () => {
    const reference = createCaller(7)
    for (let i = 0; i < 5; i++) reference.draw()
    reference.undo() // net 4 draws

    const ok = useGameStore.getState().loadSavedGame(7, reference.history)
    expect(ok).toBe(true)
    expect(useGameStore.getState().history).toEqual(reference.history)
    expect(useGameStore.getState().history.length).toBe(4)
  })

  it('loadSavedGame rejects a mismatched history and leaves state untouched', () => {
    useGameStore.getState().draw()
    useGameStore.getState().draw()
    const before = useGameStore.getState().history

    const ok = useGameStore.getState().loadSavedGame(99, [1, 2, 3, 4, 5])
    expect(ok).toBe(false)
    expect(useGameStore.getState().history).toEqual(before)
  })

  it('newGame clears history and produces a fresh caller with a new seed', () => {
    const seedBefore = useGameStore.getState().seed
    useGameStore.getState().draw()
    useGameStore.getState().draw()

    useGameStore.getState().newGame()
    const state = useGameStore.getState()
    expect(state.history).toEqual([])
    expect(state.called.size).toBe(0)
    expect(state.currentNumber).toBeNull()
    expect(state.drawSeq).toBe(0)
    expect(state.seed).not.toBe(seedBefore)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gameStore.test.ts`
Expected: FAIL — `loadSavedGame`/`newGame`/`seed`/`saveFailed` don't exist on the store yet.

- [ ] **Step 3: Implement**

Replace `src/store/gameStore.ts` with:

```ts
// Host-screen state. Thin wrapper around one Caller instance (src/engine/caller.ts)
// so React components can subscribe to it. The Caller is the source of truth for
// draw order — this store just mirrors its state after every action and never
// duplicates the shuffling/undo logic itself.
//
// Every draw/undo autosaves the caller's seed + history to localStorage
// (src/store/persist.ts) so a host refresh doesn't lose the game. Resuming
// from that save is NOT decided here — loadSavedGame only performs the
// rebuild-and-verify; src/store/gameSession.ts decides when it actually runs
// and is the only place that also touches claimStore alongside it.

import { create } from 'zustand'
import { createCaller, replayCaller } from '../engine/caller'
import * as persist from './persist'

interface GameState {
  /** The most recently drawn number, or null before the first draw. */
  currentNumber: number | null
  /** All numbers called so far, in draw order. */
  history: number[]
  /** Same as history, but a Set — for fast "has this been called?" lookups. */
  called: Set<number>
  /** Timestamp (ms) of the last draw/undo. Drives the pace indicator. Null
   *  before the first draw, so the nudge never shows on an empty board. */
  lastDrawnAt: number | null
  /** Counts DRAWS only — undo leaves it alone. The reaction layer keys off
   *  this, so a reaction plays once per draw and never replays on undo. */
  drawSeq: number
  /** The seed backing the current caller. Lets newGame() be proven to have
   *  picked a genuinely different caller, not just cleared persistence. */
  seed: number
  /** True when the most recent autosave to localStorage failed (storage full
   *  or blocked). The host UI shows this so a lost save is never silent. */
  saveFailed: boolean
  draw: () => void
  undo: () => void
  /**
   * Replace the live caller with one reconstructed from a persisted seed +
   * history. Returns true and commits the new state if the replay matches
   * the persisted history exactly; returns false and leaves the current
   * state untouched otherwise (a mismatched replay is never trusted).
   *
   * Does not decide whether to resume or what to tell the host — see
   * src/store/gameSession.ts for that.
   */
  loadSavedGame: (seed: number, history: number[]) => boolean
  /** Start over: a brand-new random-seed caller and a cleared save. */
  newGame: () => void
}

// One caller for the whole app's lifetime. A real game has a single, fixed
// draw order decided at page load — not a new shuffle every render. `let`,
// not `const`, because loadSavedGame/newGame replace it wholesale.
let caller = createCaller()

export const useGameStore = create<GameState>((set) => ({
  currentNumber: null,
  history: [],
  called: new Set(),
  lastDrawnAt: null,
  drawSeq: 0,
  seed: caller.seed,
  saveFailed: false,

  draw: () => {
    const number = caller.draw()
    if (number === null) return // all 90 already called, nothing to do
    const saved = persist.saveGame(caller.seed, caller.history)
    set((state) => ({
      currentNumber: number,
      history: caller.history,
      called: caller.called,
      lastDrawnAt: Date.now(),
      drawSeq: state.drawSeq + 1,
      saveFailed: !saved,
    }))
  },

  undo: () => {
    const removed = caller.undo()
    if (removed === null) return // nothing has been drawn yet
    const history = caller.history
    const saved = persist.saveGame(caller.seed, history)
    set({
      // Undo means "that draw didn't count" — the display should fall back
      // to whatever was current before it, not go blank.
      currentNumber: history.length > 0 ? history[history.length - 1] : null,
      history,
      called: caller.called,
      lastDrawnAt: history.length > 0 ? Date.now() : null,
      saveFailed: !saved,
    })
  },

  loadSavedGame: (seed, history) => {
    const replayed = replayCaller(seed, history)
    if (replayed === null) return false

    caller = replayed
    set({
      currentNumber: history.length > 0 ? history[history.length - 1] : null,
      history: caller.history,
      called: caller.called,
      lastDrawnAt: history.length > 0 ? Date.now() : null,
      drawSeq: history.length,
      seed: caller.seed,
      saveFailed: false,
    })
    return true
  },

  newGame: () => {
    caller = createCaller() // fresh random seed — never reuses the old game's
    persist.clearGame()
    set({
      currentNumber: null,
      history: [],
      called: new Set(),
      lastDrawnAt: null,
      drawSeq: 0,
      seed: caller.seed,
      saveFailed: false,
    })
  },
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gameStore.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add src/store/gameStore.ts src/store/gameStore.test.ts
git commit -m "$(cat <<'EOF'
Autosave gameStore and add loadSavedGame/newGame

draw()/undo() persist seed+history after every call and expose
saveFailed so a blocked write isn't silent. loadSavedGame rebuilds via
replayCaller and only commits on an exact match; newGame always builds
a genuinely new Caller rather than just clearing persistence.
EOF
)"
```

---

### Task 4: `claimStore.ts` — autosave bogeys, `loadSavedBogeys`

**Files:**
- Modify: `src/store/claimStore.ts`
- Test: `src/store/claimStore.test.ts` (new)

**Interfaces:**
- Consumes: `saveBogeys`, `clearBogeys` from `./persist` (Task 2).
- Produces: `ClaimState.saveFailed: boolean`, `ClaimState.loadSavedBogeys(bogeys: Record<string, number>): void`. Consumed by Task 5.

- [ ] **Step 1: Write the failing test**

Create `src/store/claimStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { installMockLocalStorage } from '../test/mockLocalStorage'
import { useClaimStore } from './claimStore'

beforeEach(() => {
  installMockLocalStorage()
  useClaimStore.getState().reset()
})

describe('claimStore', () => {
  it('records an invalid ruling and increments the bogey tally, without failing to save', () => {
    useClaimStore.getState().record({
      ticketId: 'K3P9Z-04',
      dividend: 'fullHouse',
      valid: false,
      atCall: 40,
    })
    expect(useClaimStore.getState().bogeys['K3P9Z-04']).toBe(1)
    expect(useClaimStore.getState().saveFailed).toBe(false)
  })

  it('does not tally a valid ruling', () => {
    useClaimStore.getState().record({
      ticketId: 'K3P9Z-04',
      dividend: 'fullHouse',
      valid: true,
      atCall: 40,
    })
    expect(useClaimStore.getState().bogeys['K3P9Z-04']).toBeUndefined()
  })

  it('loadSavedBogeys restores a tally exactly, simulating a reload', () => {
    useClaimStore.getState().record({
      ticketId: 'ABCDE-01',
      dividend: 'topLine',
      valid: false,
      atCall: 10,
    })
    useClaimStore.getState().record({
      ticketId: 'ABCDE-01',
      dividend: 'corners',
      valid: false,
      atCall: 20,
    })
    const saved = useClaimStore.getState().bogeys

    useClaimStore.getState().reset() // simulate a fresh module state after reload
    expect(useClaimStore.getState().bogeys).toEqual({})

    useClaimStore.getState().loadSavedBogeys(saved)
    expect(useClaimStore.getState().bogeys).toEqual({ 'ABCDE-01': 2 })
  })

  it('reset clears the tally', () => {
    useClaimStore.getState().record({
      ticketId: 'X',
      dividend: 'earlyFive',
      valid: false,
      atCall: 5,
    })
    useClaimStore.getState().reset()
    expect(useClaimStore.getState().bogeys).toEqual({})
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- claimStore.test.ts`
Expected: FAIL — `loadSavedBogeys`/`saveFailed` don't exist yet.

- [ ] **Step 3: Implement**

Replace `src/store/claimStore.ts` with:

```ts
// Claims the host has ruled on. Host screen only.
//
// The bogey counter answers a question every real tambola host has: "is this the same
// person shouting a wrong claim for the fourth time?" It counts INVALID claims per
// ticket ID.
//
// What it counts is the verifier's verdict, and the verifier compares the CALLED
// numbers against the ticket's true 15 numbers. It never looks at what the player
// marked — the app has no idea what they marked, and a player who marked wrongly but
// claims correctly is not a bogey.
//
// The tally autosaves to localStorage (src/store/persist.ts) on every ruling, so a
// host refresh doesn't lose it. Only the tally persists — the detailed rulings log
// below is in-memory only, since nothing reads it back across a reload.

import { create } from 'zustand'
import type { Dividend } from '../engine/ticket'
import * as persist from './persist'

/** One ruling, kept so the host can see what happened rather than just a tally. */
export interface Ruling {
  ticketId: string
  dividend: Dividend
  valid: boolean
  /** How many numbers had been called when the claim was ruled on. */
  atCall: number
}

interface ClaimState {
  /** Every ruling, newest last. */
  rulings: Ruling[]
  /** ticket ID -> number of invalid claims made from it. */
  bogeys: Record<string, number>
  /** True when the most recent autosave to localStorage failed. */
  saveFailed: boolean
  record: (ruling: Ruling) => void
  /** Replace the bogey tally with a persisted one (used when resuming a game
   *  — see src/store/gameSession.ts). Does not touch the rulings log. */
  loadSavedBogeys: (bogeys: Record<string, number>) => void
  /** Clear everything for a new game. */
  reset: () => void
}

export const useClaimStore = create<ClaimState>((set) => ({
  rulings: [],
  bogeys: {},
  saveFailed: false,

  record: (ruling) =>
    set((state) => {
      const bogeys = ruling.valid
        ? state.bogeys
        : {
            ...state.bogeys,
            [ruling.ticketId]: (state.bogeys[ruling.ticketId] ?? 0) + 1,
          }
      const saved = persist.saveBogeys(bogeys)
      return {
        rulings: [...state.rulings, ruling],
        bogeys,
        saveFailed: !saved,
      }
    }),

  loadSavedBogeys: (bogeys) => set({ bogeys }),

  reset: () => {
    persist.clearBogeys()
    set({ rulings: [], bogeys: {}, saveFailed: false })
  },
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- claimStore.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add src/store/claimStore.ts src/store/claimStore.test.ts
git commit -m "$(cat <<'EOF'
Autosave claimStore bogey tally and add loadSavedBogeys

record() persists the tally after every ruling and exposes saveFailed;
loadSavedBogeys hydrates it on resume without touching the in-memory
rulings log, which isn't persisted.
EOF
)"
```

---

### Task 5: `gameSession.ts` — atomic resume / new-game orchestrator

**Files:**
- Create: `src/store/gameSession.ts`
- Test: `src/store/gameSession.test.ts` (new)

**Interfaces:**
- Consumes: `useGameStore` (Task 3: `loadSavedGame`, `newGame`, `seed`, `history`), `useClaimStore` (Task 4: `loadSavedBogeys`, `reset`, `bogeys`, `record`), `persist.loadBogeys`/`persist.loadGame` (Task 2).
- Produces: `ResumeResult = { ok: true } | { ok: false; reason: string }`, `resumeGame(seed: number, history: number[]): ResumeResult`, `startNewGame(): void`. Consumed by Task 8 (`App.tsx`) — the only two functions App.tsx calls for resume/new-game.

- [ ] **Step 1: Write the failing test**

Create `src/store/gameSession.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { installMockLocalStorage } from '../test/mockLocalStorage'
import { useGameStore } from './gameStore'
import { useClaimStore } from './claimStore'
import { resumeGame, startNewGame } from './gameSession'
import { createCaller } from '../engine/caller'
import * as persist from './persist'

beforeEach(() => {
  installMockLocalStorage()
  startNewGame() // clean slate before every test
})

describe('resumeGame', () => {
  it('hydrates both stores together on a valid save', () => {
    const reference = createCaller(55)
    const history: number[] = []
    for (let i = 0; i < 8; i++) history.push(reference.draw() as number)
    persist.saveBogeys({ 'K3P9Z-04': 3 })

    const result = resumeGame(55, history)

    expect(result).toEqual({ ok: true })
    expect(useGameStore.getState().history).toEqual(reference.history)
    expect(useClaimStore.getState().bogeys).toEqual({ 'K3P9Z-04': 3 })
  })

  it('wipes both stores and reports why on a mismatched replay', () => {
    useClaimStore.getState().record({
      ticketId: 'X',
      dividend: 'earlyFive',
      valid: false,
      atCall: 1,
    })

    const result = resumeGame(55, [1, 2, 3]) // not a real draw sequence for seed 55

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/new game/i)
    expect(useGameStore.getState().history).toEqual([])
    expect(useClaimStore.getState().bogeys).toEqual({})
  })
})

describe('startNewGame', () => {
  it('clears both stores and both persisted keys', () => {
    useGameStore.getState().draw()
    useClaimStore.getState().record({
      ticketId: 'X',
      dividend: 'earlyFive',
      valid: false,
      atCall: 1,
    })

    startNewGame()

    expect(useGameStore.getState().history).toEqual([])
    expect(useClaimStore.getState().bogeys).toEqual({})
    expect(persist.loadGame()).toBeNull()
    expect(persist.loadBogeys()).toEqual({})
  })

  it('produces a different seed than the previous game', () => {
    const firstSeed = useGameStore.getState().seed
    startNewGame()
    const secondSeed = useGameStore.getState().seed
    expect(secondSeed).not.toBe(firstSeed)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gameSession.test.ts`
Expected: FAIL — `src/store/gameSession.ts` doesn't exist yet.

- [ ] **Step 3: Implement**

Create `src/store/gameSession.ts`:

```ts
// Orchestrates gameStore and claimStore together for the two actions that
// must never touch only one of them: resuming a saved game, and starting a
// new one. A resumed caller with no bogey data would silently lose real
// dispute history; a fresh caller carrying a stale bogey tally from the
// previous game would be actively misleading. This module is the only place
// allowed to call both stores for those actions — App.tsx and the "New Game"
// button both go through here, never through gameStore/claimStore directly.

import { useGameStore } from './gameStore'
import { useClaimStore } from './claimStore'
import * as persist from './persist'

export type ResumeResult = { ok: true } | { ok: false; reason: string }

/**
 * Try to resume the persisted game. If the caller's replay doesn't match the
 * persisted history (e.g. a future build changes the shuffle), this falls
 * back to a brand-new game — both stores wiped — rather than resuming into
 * state nobody can trust, and reports why.
 */
export function resumeGame(seed: number, history: number[]): ResumeResult {
  const restored = useGameStore.getState().loadSavedGame(seed, history)
  if (!restored) {
    startNewGame()
    return {
      ok: false,
      reason: "Saved game data didn't match — starting a new game.",
    }
  }
  useClaimStore.getState().loadSavedBogeys(persist.loadBogeys())
  return { ok: true }
}

/** Wipe both stores and both persisted keys, and start clean. */
export function startNewGame(): void {
  useGameStore.getState().newGame()
  useClaimStore.getState().reset()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gameSession.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add src/store/gameSession.ts src/store/gameSession.test.ts
git commit -m "$(cat <<'EOF'
Add gameSession orchestrator for atomic resume/new-game

resumeGame() and startNewGame() are the only functions allowed to
touch both gameStore and claimStore for these two actions, so a
resumed caller can never end up without its bogey tally (or vice
versa). A failed replay falls back to startNewGame() automatically.
EOF
)"
```

---

### Task 6: `VerifierPanel.tsx` — milestone banner on VALID

**Files:**
- Modify: `src/components/VerifierPanel.tsx`

**Interfaces:**
- Consumes: `Theme` type from `../themes/types` (already defines `milestones: Record<MilestoneKey, ThemeMilestone>`, and `Dividend` values are a subset match of `MilestoneKey` — both are the same six strings).
- Produces: `VerifierPanelProps` gains `theme: Theme`. Consumed by Task 8 (`App.tsx` passes its already-resolved `theme`).

No test file — components in this codebase have no unit tests (no `@testing-library/react` installed; verification is `npm run build` + `npm run lint` + manual browser check per project convention). This task's "test" is Task 9's browser verification.

- [ ] **Step 1: Add the `theme` prop and milestone banner logic**

In `src/components/VerifierPanel.tsx`, add the import and prop:

```tsx
import { useState } from 'react'
import { verifyClaim, type Dividend } from '../engine/ticket'
import { parseTicketId, ticketFromRef } from '../engine/ticketId'
import { useGameStore } from '../store/gameStore'
import { useClaimStore } from '../store/claimStore'
import { TicketFace } from './TicketFace'
import type { Theme } from '../themes/types'
```

```tsx
interface VerifierPanelProps {
  onClose: () => void
  theme: Theme
}

export function VerifierPanel({ onClose, theme }: VerifierPanelProps) {
```

Add local state next to `lastRuled`:

```tsx
  const [lastRuled, setLastRuled] = useState<Dividend | null>(null)
  // The dividend's milestone phrase, shown only after a VALID ruling — reuses
  // NumberDisplay's text-amber-200 phrase-text treatment rather than a new
  // component or animation. Phase 4's reaction layer stays removed.
  const [milestonePhrase, setMilestonePhrase] = useState<string | null>(null)
```

Update `rule()` to set/clear it, and clear it on input change:

```tsx
  function rule(dividend: Dividend, valid: boolean) {
    if (ticketId === null) return
    record({ ticketId, dividend, valid, atCall: history.length })
    setLastRuled(dividend)
    setMilestonePhrase(valid ? theme.milestones[dividend].phrase : null)
  }
```

```tsx
        <input
          autoFocus
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setLastRuled(null)
            setMilestonePhrase(null)
          }}
```

Render the banner right after the ticket ID / bogey-badge row, before `<TicketFace>`:

```tsx
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono tracking-widest text-neutral-300">
              {ticketId}
            </span>
            {(bogeys[ticketId] ?? 0) > 0 && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">
                {bogeys[ticketId]} previous bogey
                {bogeys[ticketId] === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {milestonePhrase !== null && (
            <p className="mb-3 text-center text-lg font-semibold text-amber-200 sm:text-xl">
              {milestonePhrase}
            </p>
          )}

          {/* The ticket itself, with the numbers that have genuinely been called
```

(The comment above `<TicketFace>` already exists in the file — leave it in place, just insert the banner block before it.)

- [ ] **Step 2: Typecheck**

Run: `npm run build`
Expected: succeeds (this will currently fail because `App.tsx` doesn't pass `theme` yet — that's fixed in Task 8; if doing these tasks out of order, expect a type error here naming the missing prop, which is resolved by Task 8, not a sign this step is wrong).

- [ ] **Step 3: Commit**

```bash
git add src/components/VerifierPanel.tsx
git commit -m "$(cat <<'EOF'
Show milestone phrase in VerifierPanel on a VALID ruling

Reuses NumberDisplay's text-amber-200 phrase styling; no new
component, no animation. Banner clears on the next ruling or when the
ticket ID input changes.
EOF
)"
```

---

### Task 7: `ResumeGamePrompt.tsx` — new component

**Files:**
- Create: `src/components/ResumeGamePrompt.tsx`

**Interfaces:**
- Produces: `ResumeGamePromptProps { drawCount: number; savedAt: number; onResume: () => void; onNewGame: () => void }`, exported `ResumeGamePrompt`. Consumed by Task 8.

No test file — same rationale as Task 6 (no component test harness in this project; verified in Task 9).

- [ ] **Step 1: Implement**

Create `src/components/ResumeGamePrompt.tsx`:

```tsx
// Shown once at startup when a saved game (src/store/persist.ts) is found —
// never silently: a host opening the app mid-party must see what they're
// about to resume before it happens, not inherit last week's game by
// accident. Same full-screen overlay pattern as VerifierPanel, but on top of
// it (z-70) since this gate runs before any other panel could be open.

interface ResumeGamePromptProps {
  drawCount: number
  savedAt: number
  onResume: () => void
  onNewGame: () => void
}

export function ResumeGamePrompt({
  drawCount,
  savedAt,
  onResume,
  onNewGame,
}: ResumeGamePromptProps) {
  const savedAgo = formatRelativeTime(savedAt)

  return (
    <div className="fixed inset-0 z-70 flex flex-col items-center justify-center gap-6 bg-neutral-950 px-6 text-center text-white">
      <div>
        <h2 className="text-xl font-bold">Resume the last game?</h2>
        <p className="mt-2 text-sm text-neutral-400">
          {drawCount} number{drawCount === 1 ? '' : 's'} called, saved {savedAgo}.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onResume}
          className="rounded-xl bg-emerald-500 px-4 py-3 text-base font-bold text-neutral-950"
        >
          Resume game
        </button>
        <button
          type="button"
          onClick={onNewGame}
          className="rounded-xl bg-neutral-800 px-4 py-3 text-base font-semibold text-neutral-300"
        >
          Start new game
        </button>
      </div>
    </div>
  )
}

/** Coarse, human relative time — this only needs to answer "is this stale?", not be precise. */
function formatRelativeTime(timestampMs: number): string {
  const diffMs = Date.now() - timestampMs
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run build`
Expected: succeeds (component isn't wired into `App.tsx` yet, so it's unused-but-valid until Task 8; if the linter flags "unused export" that's fine, it's consumed next task).

- [ ] **Step 3: Commit**

```bash
git add src/components/ResumeGamePrompt.tsx
git commit -m "feat: add ResumeGamePrompt component for host game resume gate"
```

---

### Task 8: `App.tsx` — wire the resume gate, New Game button, save-failed indicator

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `resumeGame`, `startNewGame` from `./store/gameSession` (Task 5); `loadGame`, `PersistedGame` from `./store/persist` (Task 2); `useClaimStore` from `./store/claimStore` (Task 4); `ResumeGamePrompt` from `./components/ResumeGamePrompt` (Task 7); `VerifierPanel`'s new `theme` prop (Task 6).

No test file — same rationale as Tasks 6/7. Verified in Task 9.

- [ ] **Step 1: Implement**

Modify `src/App.tsx`. Update imports:

```tsx
import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import { useClaimStore } from './store/claimStore'
import { NumberDisplay } from './components/NumberDisplay'
import { DrawButton } from './components/DrawButton'
import { UndoButton } from './components/UndoButton'
import { NumberGrid } from './components/NumberGrid'
import { PaceIndicator } from './components/PaceIndicator'
import { ThemePicker } from './components/ThemePicker'
import { DisplayMode } from './components/DisplayMode'
import { TicketsPanel } from './components/TicketsPanel'
import { VerifierPanel } from './components/VerifierPanel'
import { PrintSheet } from './components/PrintSheet'
import { ResumeGamePrompt } from './components/ResumeGamePrompt'
import { useTicketSetStore } from './store/ticketSetStore'
import { themes } from './themes'
import * as persist from './store/persist'
import { resumeGame, startNewGame } from './store/gameSession'
```

Inside the `function App()` body, right after the existing `useGameStore` selectors, add the new state and selectors (before `themeId`):

```tsx
function App() {
  const currentNumber = useGameStore((s) => s.currentNumber)
  const called = useGameStore((s) => s.called)
  const lastDrawnAt = useGameStore((s) => s.lastDrawnAt)
  const draw = useGameStore((s) => s.draw)
  const undo = useGameStore((s) => s.undo)
  const gameSaveFailed = useGameStore((s) => s.saveFailed)
  const claimSaveFailed = useClaimStore((s) => s.saveFailed)

  // A saved game found on mount, held here until the host explicitly picks
  // Resume or New Game — never auto-resumed. history.length === 0 (a draw
  // undone right before a refresh) is treated as "nothing to resume".
  const [pendingResume, setPendingResume] = useState<persist.PersistedGame | null>(
    () => {
      const saved = persist.loadGame()
      return saved !== null && saved.history.length > 0 ? saved : null
    },
  )
  // Set only if a resume was attempted and the replay didn't match — shown
  // once the host reaches the normal screen, since gameSession already fell
  // back to a fresh game by then.
  const [resumeError, setResumeError] = useState<string | null>(null)

  // Which pack is active. UI state only — switching themes mid-game changes
  // the phrases, not the draw order, so it's deliberately not in the game store.
  const [themeId, setThemeId] = useState(themes[0].id)
```

Right after `const theme = themes.find(...)` and before the `if (showDisplay)` branch, add the resume gate (it must come first — the resume decision applies whether the host lands on the control screen or on `/?display=1`, so a saved game is never silently dropped just because this load happens to be the cast tab):

```tsx
  const theme = themes.find((t) => t.id === themeId) ?? themes[0]

  if (pendingResume !== null) {
    return (
      <ResumeGamePrompt
        drawCount={pendingResume.history.length}
        savedAt={pendingResume.savedAt}
        onResume={() => {
          const result = resumeGame(pendingResume.seed, pendingResume.history)
          if (!result.ok) setResumeError(result.reason)
          setPendingResume(null)
        }}
        onNewGame={() => {
          startNewGame()
          setPendingResume(null)
        }}
      />
    )
  }

  // The stage. Uses the URL's theme (or the first pack) rather than the picker
  // state — a cast tab is its own page load, there is no picker on screen.
  if (showDisplay) {
    const displayTheme = themes.find((t) => t.id === urlThemeId) ?? themes[0]
    return <DisplayMode theme={displayTheme} />
  }
```

(Remove the old duplicate `if (showDisplay)` block plus its preceding comment further down — there should be exactly one now, in the position shown above.)

Update the header to add the New Game button, the resume-error banner, and the save-failed indicator, and pass `theme` to `VerifierPanel`:

```tsx
  return (
    <>
    <div className="flex h-dvh flex-col bg-neutral-950 text-white print:hidden">
      {resumeError !== null && (
        <div className="flex items-center justify-between gap-2 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
          <span>{resumeError}</span>
          <button
            type="button"
            onClick={() => setResumeError(null)}
            className="font-bold"
          >
            ×
          </button>
        </div>
      )}
      <header className="flex items-center justify-between gap-2 px-3 py-1">
        <ThemePicker themes={themes} currentId={themeId} onChange={setThemeId} />
        <div className="flex items-center gap-2">
          {(gameSaveFailed || claimSaveFailed) && (
            <span className="text-xs font-semibold text-red-400">
              Not saving to this device
            </span>
          )}
          <button
            type="button"
            onClick={() => setPanel('tickets')}
            className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-semibold"
          >
            Tickets
          </button>
          <button
            type="button"
            onClick={() => setPanel('verify')}
            className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-semibold"
          >
            Check
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Start a new game? This clears all draws and bogey tallies.',
                )
              ) {
                startNewGame()
              }
            }}
            className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-semibold"
          >
            New Game
          </button>
          <UndoButton onUndo={undo} disabled={!canUndo} />
        </div>
      </header>
```

And further down, pass `theme` to `VerifierPanel`:

```tsx
      {panel === 'verify' && (
        <VerifierPanel onClose={() => setPanel(null)} theme={theme} />
      )}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run build && npm run lint`
Expected: both succeed with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "$(cat <<'EOF'
Wire resume gate, New Game button, and save-failed indicator into App

A saved game with any draws blocks the normal screen behind
ResumeGamePrompt until the host picks Resume or New Game — checked
before the /?display=1 branch so a cast session isn't skipped. Both
paths and the header's New Game button go through gameSession, never
gameStore/claimStore directly.
EOF
)"
```

---

### Task 9: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: every test file passes, including the four new ones (`persist.test.ts`, `gameStore.test.ts`, `claimStore.test.ts`, `gameSession.test.ts`), the extended `caller.test.ts`, and — unmodified — `src/player/airgap.test.ts`.

- [ ] **Step 2: Confirm `airgap.test.ts` was not touched**

Run: `git diff main -- src/player/airgap.test.ts` (or `git log -p -- src/player/airgap.test.ts` since the branch started)
Expected: no output — the file is untouched by this work.

- [ ] **Step 3: Build and lint**

Run: `npm run build && npm run lint`
Expected: both clean.

- [ ] **Step 4: Manual browser verification — milestone**

Using the project's dev server preview: draw a handful of numbers, open Tickets, generate a batch, open Check, type a ticket ID whose Early Five (or any dividend) is satisfied by the numbers drawn so far, tap VALID. Confirm the amber milestone phrase appears immediately, disappears when the ticket ID input is edited or another dividend is ruled on, and does not appear on a BOGEY tap.

- [ ] **Step 5: Manual browser verification — persistence**

Draw several numbers, record a bogey ruling, then hard-reload the page. Confirm `ResumeGamePrompt` appears showing the correct draw count and a sensible "saved ... ago". Tap **Resume** — confirm the number grid, current number, and the bogey badge in Check all match pre-reload state exactly. Reload again, tap **New Game** this time — confirm the board is empty and the previous bogey tally is gone. Draw a couple of numbers, tap the header **New Game** button, confirm the browser `confirm()` appears and cancelling it leaves the game untouched.

- [ ] **Step 6: Manual verification — display mode**

With a saved game present, load `/?display=1` directly. Confirm the resume prompt still appears (checked before the display branch) and, after Resume, the stage shows the correct current number and board state.

- [ ] **Step 7: Final commit (only if any fixes were needed in this task)**

```bash
git add -A
git commit -m "fix: address issues found during full verification pass"
```
