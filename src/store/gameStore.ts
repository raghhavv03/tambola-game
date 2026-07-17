// Host-screen state. Thin wrapper around one Caller instance (src/engine/caller.ts)
// so React components can subscribe to it. The Caller is the source of truth for
// draw order — this store just mirrors its state after every action and never
// duplicates the shuffling/undo logic itself.

import { create } from 'zustand'
import { createCaller } from '../engine/caller'

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
  draw: () => void
  undo: () => void
}

// One caller for the whole app's lifetime. A real game has a single, fixed
// draw order decided at page load — not a new shuffle every render.
const caller = createCaller()

export const useGameStore = create<GameState>((set) => ({
  currentNumber: null,
  history: [],
  called: new Set(),
  lastDrawnAt: null,
  drawSeq: 0,

  draw: () => {
    const number = caller.draw()
    if (number === null) return // all 90 already called, nothing to do
    set((state) => ({
      currentNumber: number,
      history: caller.history,
      called: caller.called,
      lastDrawnAt: Date.now(),
      drawSeq: state.drawSeq + 1,
    }))
  },

  undo: () => {
    const removed = caller.undo()
    if (removed === null) return // nothing has been drawn yet
    const history = caller.history
    set({
      // Undo means "that draw didn't count" — the display should fall back
      // to whatever was current before it, not go blank.
      currentNumber: history.length > 0 ? history[history.length - 1] : null,
      history,
      called: caller.called,
      lastDrawnAt: history.length > 0 ? Date.now() : null,
    })
  },
}))
