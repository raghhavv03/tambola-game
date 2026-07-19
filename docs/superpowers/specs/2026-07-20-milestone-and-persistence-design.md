# Milestone trigger + host persistence

Two independent features from PROGRESS.md's "Not started" list.

## 1. Milestone trigger

**Problem:** theme packs carry `milestones[dividend].phrase` (see `src/themes/types.ts`) but nothing ever reads it.

**Trigger:** `VerifierPanel.rule(dividend, valid)` — the existing tap that records a ruling in `claimStore`.

**Surface:** VerifierPanel only. Not `NumberDisplay`, not `DisplayMode`. Those are separate render branches picked by URL at load (`/?display=1`), never simultaneous with the verifier in one session — pushing the milestone into `gameStore` for them would add a cross-store dependency for a surface that's never live when verification happens (the display branch has no verify entry point at all today).

**Behavior:**
- `VerifierPanel` gains a `theme: Theme` prop, passed from `App.tsx` (which already resolves `theme`).
- On `rule(dividend, valid)`: if `valid`, set local state `milestonePhrase = theme.milestones[dividend].phrase`. If not valid, clear it.
- Banner renders using the same `text-amber-200` phrase-text convention as `NumberDisplay` — plain text, no new component, no animation import (Phase 4's reaction layer was deliberately removed and stays removed).
- Clears on the next `rule()` call (any dividend) or when the ticket ID input changes.

**No changes to:** `gameStore.ts`, `DisplayMode.tsx`, theme schema, engine.

## 2. Host persistence

**Problem:** a host refresh loses draw order and bogey tallies (in-memory only).

### Storage layer — `src/store/persist.ts` (new, host-only)

Two keys, prefix disjoint from the player's `tambola:marks:` (`src/player/marks.ts`):
- `tambola:host:game` → `{ seed: number, history: number[], savedAt: number }`
- `tambola:host:bogeys` → `Record<ticketId, number>`

Reads (`loadGame`, `loadBogeys`) degrade silently to `null` / `{}` on any parse failure or shape mismatch — same as `marks.ts`'s precedent. This is a materially different failure than the replay-mismatch case below (nothing was ever meaningfully saved vs. something was saved but doesn't reconstruct), so it gets no user-facing message, matching how the player side already treats blocked storage.

Writes (`saveGame`, `saveBogeys`) return `boolean`. On catch: `console.warn` (never throw — a blocked/full localStorage must not crash the game) and return `false`. Callers surface that failure to the host (see below) rather than swallowing it, because losing draw history mid-party is a bigger deal than losing a player's tap-marks.

### Engine — `src/engine/caller.ts`

- `Caller` gains a readonly `seed: number` (the value `createCaller` actually used, whether passed in or generated). Additive, no breaking change.
- New pure export `replayCaller(seed, history): Caller | null`: builds `createCaller(seed)`, calls `.draw()` `history.length` times, then deep-equal-checks the reconstructed `.history` against the persisted `history`. Returns the reconstructed `Caller` on match, `null` on mismatch. This is the one place that does the "rebuild by replay, not by directly assigning the Set/array" reconstruction, so both the store action and its tests share one implementation.

### `src/store/gameStore.ts`

- `caller` becomes `let` (reassignable — needed for both resume and new-game).
- `draw()` / `undo()`: after updating in-memory state, call `persist.saveGame(caller.seed, caller.history)`; store its boolean result in a new `saveFailed: boolean` field.
- New `loadSavedGame(seed, history): boolean`: calls `replayCaller`. On success, replaces the module's `caller`, sets `currentNumber`/`history`/`called`/`drawSeq` (= `history.length`) /`lastDrawnAt` (= `Date.now()` if any history, else `null`) from it, returns `true`. On failure, leaves everything untouched and returns `false` — it does not itself decide what happens next; that's the orchestrator's job.
- New `newGame(): void`: fresh random-seed `caller`, resets all fields to their initial values, calls `persist.clearGame()`.

### `src/store/claimStore.ts`

- `record()`: after updating `bogeys`, call `persist.saveBogeys(bogeys)`, store result in new `saveFailed: boolean` field.
- `reset()`: also calls `persist.clearBogeys()` (already resets in-memory `bogeys`/`rulings`).
- New `loadSavedBogeys(bogeys: Record<string, number>): void`: `set({ bogeys })`. (`rulings` — the detailed log — is not persisted; only the tally is, per the original ask.)

### `src/store/gameSession.ts` (new) — atomicity

The one place that touches both stores for a resume or a new game, so no caller can fire one without the other:

```
resumeGame(seed, history): { ok: true } | { ok: false, reason: string }
  - calls gameStore.loadSavedGame(seed, history)
  - on success: also calls claimStore.loadSavedBogeys(persist.loadBogeys()); returns { ok: true }
  - on failure: calls startNewGame() itself (wipes both stores + both persisted keys),
    returns { ok: false, reason: "Saved game data didn't match — starting a new game." }

startNewGame(): void
  - calls gameStore.newGame() and claimStore.reset()
```

`App.tsx` and the "New Game" button only ever call these two functions — never `gameStore`/`claimStore` methods directly for resume/new-game.

### `App.tsx`

- On mount: `persist.loadGame()`. If non-null and `history.length > 0`, render `ResumeGamePrompt` (new component, full-screen overlay, same visual pattern as `VerifierPanel`) before the normal controls — blocks DRAW/Undo/etc. until resolved.
  - **Resume** → `gameSession.resumeGame(seed, history)`. If `ok: false`, show `reason` in a small dismissible banner (reusing the existing amber-warning text pattern already in `VerifierPanel`).
  - **New Game** → `gameSession.startNewGame()`.
- No saved game (or `history.length === 0`, e.g. a draw immediately undone before refresh) → no prompt, game starts fresh exactly as today.
- New header button "New Game", available mid-game too: `window.confirm(...)` then `gameSession.startNewGame()`. No custom modal — matches existing "boring over clever" style; no other confirm-dialog precedent exists in the app, and this is the app's first destructive action, so the plain browser dialog is the least-new-surface-area choice.
- Small text indicator in the header when `gameStore.saveFailed || claimStore.saveFailed` — "Not saving to this device" or similar, so a host on blocked storage isn't silently losing history.
- `VerifierPanel` gets the new `theme` prop.

### Testing

- `engine/caller.test.ts`: add cases for `replayCaller` — matches after N draws, matches after an undo (fewer draws replayed), returns `null` on a mismatched/tampered history array, `seed` round-trips through `createCaller`.
- `store/persist.test.ts` (new): save/load/clear round-trip for both keys; malformed JSON → graceful `null`/`{}`; a `localStorage` that throws on `setItem` → `saveGame`/`saveBogeys` return `false` and `console.warn` fires (spy), no throw.
- `store/gameStore.test.ts` (new): reload-equivalent — draw N times, call `loadSavedGame` on a fresh store instance with the same seed/history, assert identical `history`/`remaining`/`called`; same after an undo; `loadSavedGame` with a deliberately wrong history array returns `false` and leaves state untouched.
- `store/claimStore.test.ts` (new): record some bogeys, `loadSavedBogeys` on a fresh instance restores the tally exactly.
- `store/gameSession.test.ts` (new): `resumeGame` hydrates both stores together on a valid save; on a corrupted save it wipes both and returns the failure reason; `startNewGame` clears both stores and both persisted keys.
- Run the full existing suite (`npm test`) and confirm `airgap.test.ts` passes unmodified — no new file here is reachable from `player/PlayerApp.tsx`, and no host file names the `tambola:marks:` prefix.
- `npm run build` / `npm run lint` clean.

### Explicitly out of scope

- Cross-tab / cross-device sync of any kind (host or player side).
- Persisting the detailed rulings log (only the bogey tally).
- Any change to `DisplayMode.tsx`, theme schema, or the reaction-layer decision.
