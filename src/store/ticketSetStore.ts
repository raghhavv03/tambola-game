// The set of tickets this host handed out. Host screen only — never imported by /t
// (see src/player/airgap.test.ts, which fails the build if it ever is).
//
// Note what is NOT stored: the tickets themselves aren't state, they're a function of
// (setSeed, count). Store the seed, derive the grids. That's the same property the
// player's QR link relies on — the ticket travels as a recipe, not as data.

import { create } from 'zustand'
import {
  generateIdentifiedSet,
  type IdentifiedTicket,
} from '../engine/ticketId'

/** A fresh, unpredictable seed for a new batch of tickets. */
function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff)
}

interface TicketSetState {
  /** Seed the current batch was generated from. Half of every ticket ID. */
  setSeed: number
  /** How many tickets are in the batch. */
  count: number
  /** The batch itself, derived — kept here so components don't regenerate on render. */
  tickets: IdentifiedTicket[]
  /** Change the batch size, keeping the same seed (existing IDs stay valid). */
  setCount: (count: number) => void
  /** Throw the batch away and make a new one. Invalidates every previous QR/print. */
  regenerate: () => void
}

const INITIAL_COUNT = 6

export const useTicketSetStore = create<TicketSetState>((set, get) => {
  const setSeed = randomSeed()

  return {
    setSeed,
    count: INITIAL_COUNT,
    tickets: generateIdentifiedSet(INITIAL_COUNT, setSeed),

    setCount: (count) => {
      // Growing the batch never changes the tickets already printed: generateSet
      // draws seeds sequentially, so the first N are stable (see ticketId.ts).
      const safeCount = Math.max(1, Math.min(60, Math.floor(count)))
      set({
        count: safeCount,
        tickets: generateIdentifiedSet(safeCount, get().setSeed),
      })
    },

    regenerate: () => {
      const nextSeed = randomSeed()
      set({
        setSeed: nextSeed,
        tickets: generateIdentifiedSet(get().count, nextSeed),
      })
    },
  }
})
