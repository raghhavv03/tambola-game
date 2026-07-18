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

import { create } from 'zustand'
import type { Dividend } from '../engine/ticket'

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
  record: (ruling: Ruling) => void
  /** Clear everything for a new game. */
  reset: () => void
}

export const useClaimStore = create<ClaimState>((set) => ({
  rulings: [],
  bogeys: {},

  record: (ruling) =>
    set((state) => ({
      rulings: [...state.rulings, ruling],
      bogeys: ruling.valid
        ? state.bogeys
        : {
            ...state.bogeys,
            [ruling.ticketId]: (state.bogeys[ruling.ticketId] ?? 0) + 1,
          },
    })),

  reset: () => set({ rulings: [], bogeys: {} }),
}))
