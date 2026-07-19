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
