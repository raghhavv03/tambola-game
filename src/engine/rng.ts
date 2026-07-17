// Seedable pseudo-random number generator, shared by the engine.
//
// Math.random() can't be seeded, so two runs never match. For games and tests we want
// the opposite: the SAME seed must always give the SAME stream of numbers, so tests
// are deterministic and a host can replay a game from its seed. mulberry32 is a tiny,
// well-known seedable PRNG — not cryptographic, but perfectly repeatable, which is all
// we need. Call it with a seed to get a function that returns the next number in
// [0, 1) each time you call it (a drop-in stand-in for Math.random that we control).
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0 // coerce to an unsigned 32-bit integer
  return function next(): number {
    // The exact bit-twiddling isn't meaningful to read — it's a published formula
    // whose only job is to scramble `state` into a well-spread number each call.
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 // divide by 2^32 to land in [0, 1)
  }
}
