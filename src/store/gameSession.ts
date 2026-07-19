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
