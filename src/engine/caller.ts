// The number-caller engine. Pure TypeScript: no React, no imports from the rest of
// the app. It knows nothing about tickets, players, or the DOM — it just decides the
// order the numbers 1–90 come out in and lets the host step forward and back through
// them. Everything visual lives elsewhere and reads from this.

import { mulberry32 } from './rng'

const POOL_SIZE = 90 // tambola is always numbers 1..90

// A Caller is the object createCaller() hands back. Listing the shape here means the
// editor can autocomplete it and the compiler checks every usage.
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

// --- The shuffle ---------------------------------------------------------------
//
// Fisher-Yates: the standard way to shuffle an array so every ordering is equally
// likely. We walk from the last slot down to the second, and for each slot pick a
// random earlier-or-equal slot to swap it with. See the line-by-line writeup in the
// chat for why this is correct and why "pick a random number, retry if taken" is not.
function shuffle(values: number[], rand: () => number): number[] {
  const arr = values.slice() // copy so we never mutate the caller's array
  for (let i = arr.length - 1; i > 0; i--) {
    // j is a random index in [0, i] — anywhere from the start up to i itself.
    const j = Math.floor(rand() * (i + 1))
    // Swap arr[i] and arr[j]. After this, arr[i] is locked in and never touched again.
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Create a fresh number-caller.
 *
 * @param seed Optional. Pass a number to get a reproducible sequence (same seed =
 *             same draws every time). Omit it and we pick a random seed, so each
 *             real game is different.
 */
export function createCaller(seed?: number): Caller {
  // If no seed was given, invent one. (Math.random is fine HERE — we only use it to
  // choose the seed for a real game; the game itself still runs off the seeded PRNG,
  // so it stays internally reproducible once started.)
  const actualSeed = seed ?? Math.floor(Math.random() * 0xffffffff)
  const rand = mulberry32(actualSeed)

  // Build [1, 2, ..., 90] then shuffle it once. `order` is the whole game's draw
  // sequence, fixed up front. Drawing just walks a pointer along it.
  const numbers = Array.from({ length: POOL_SIZE }, (_, i) => i + 1)
  const order = shuffle(numbers, rand)

  // How many numbers have been drawn. Everything else is derived from this: the first
  // `drawn` entries of `order` are history, the rest are remaining. Undo/reset are
  // just moving this pointer, which is why they can't get the state out of sync.
  let drawn = 0

  return {
    draw() {
      if (drawn >= POOL_SIZE) return null // pool exhausted
      const number = order[drawn]
      drawn++
      return number
    },

    undo() {
      if (drawn === 0) return null // nothing to undo
      drawn--
      return order[drawn] // the number we just put back
    },

    reset() {
      drawn = 0 // same `order`, back to the start — a full pool again
    },

    seed: actualSeed,

    // Getters (not stored arrays) so each read reflects the current `drawn` pointer.
    // We return copies/new Sets so outside code can't reach in and corrupt state.
    get history() {
      return order.slice(0, drawn)
    },
    get remaining() {
      return order.slice(drawn)
    },
    get called() {
      return new Set(order.slice(0, drawn))
    },
  }
}

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
