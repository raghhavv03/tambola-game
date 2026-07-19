import { describe, it, expect } from 'vitest'
import { createCaller, replayCaller } from './caller'

// A fixed seed everywhere so every run is identical and failures are reproducible.
const SEED = 42

describe('createCaller', () => {
  it('draws all 90 numbers exactly once', () => {
    const caller = createCaller(SEED)
    const drawn: number[] = []
    for (let i = 0; i < 90; i++) {
      const n = caller.draw()
      expect(n).not.toBeNull()
      drawn.push(n as number)
    }
    // Every number 1..90 present, no repeats: sorting must give exactly [1..90].
    const sorted = [...drawn].sort((a, b) => a - b)
    expect(sorted).toEqual(Array.from({ length: 90 }, (_, i) => i + 1))
    // A Set of 90 draws having size 90 confirms no duplicates slipped in.
    expect(new Set(drawn).size).toBe(90)
  })

  it('returns null on the 91st draw', () => {
    const caller = createCaller(SEED)
    for (let i = 0; i < 90; i++) caller.draw()
    expect(caller.draw()).toBeNull()
    expect(caller.remaining).toEqual([]) // pool truly empty
  })

  it('undo after N draws restores state identical to N-1 draws', () => {
    const N = 30

    // Reference caller: draw N-1 times.
    const reference = createCaller(SEED)
    for (let i = 0; i < N - 1; i++) reference.draw()

    // Test caller: draw N times, then undo once.
    const caller = createCaller(SEED)
    for (let i = 0; i < N; i++) caller.draw()
    caller.undo()

    // Same seed + same net number of draws => identical observable state.
    expect(caller.history).toEqual(reference.history)
    expect(caller.remaining).toEqual(reference.remaining)
    expect([...caller.called]).toEqual([...reference.called])
  })

  it('undo at zero draws is a no-op', () => {
    const caller = createCaller(SEED)
    expect(caller.undo()).toBeNull()
    expect(caller.history).toEqual([])
    expect(caller.remaining.length).toBe(90)
    // Undo didn't corrupt anything: a following draw still works normally.
    expect(caller.draw()).not.toBeNull()
  })

  it('two callers with the same seed produce identical sequences', () => {
    const a = createCaller(SEED)
    const b = createCaller(SEED)
    const seqA: (number | null)[] = []
    const seqB: (number | null)[] = []
    for (let i = 0; i < 90; i++) {
      seqA.push(a.draw())
      seqB.push(b.draw())
    }
    expect(seqA).toEqual(seqB)
  })

  it('reset restores a full pool', () => {
    const caller = createCaller(SEED)
    for (let i = 0; i < 50; i++) caller.draw()
    caller.reset()

    expect(caller.history).toEqual([])
    expect(caller.remaining.length).toBe(90)
    expect(caller.called.size).toBe(0)

    // Reset keeps the same shuffle order, so a fresh caller with the same seed draws
    // the identical sequence after this one is reset.
    const fresh = createCaller(SEED)
    expect(caller.draw()).toBe(fresh.draw())
  })
})

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
