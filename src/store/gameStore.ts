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
