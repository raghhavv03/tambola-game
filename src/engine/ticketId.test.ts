import { describe, it, expect } from 'vitest'
import {
  formatTicketId,
  parseTicketId,
  ticketFromId,
  ticketFromRef,
  generateIdentifiedSet,
} from './ticketId'
import { generateSet } from './ticket'

describe('ticket IDs', () => {
  it('round-trips seed and index through format/parse', () => {
    const ref = parseTicketId(formatTicketId(123456, 4))
    expect(ref).toEqual({ setSeed: 123456, index: 4 })
  })

  it('accepts sloppy human input (lowercase, spaces)', () => {
    const id = formatTicketId(987654, 11)
    expect(parseTicketId(`  ${id.toLowerCase()} `)).toEqual({
      setSeed: 987654,
      index: 11,
    })
  })

  it('never emits a character that could be misread', () => {
    // I, L, O and U are absent from the alphabet on purpose — see ticketId.ts.
    for (let seed = 0; seed < 5000; seed++) {
      expect(formatTicketId(seed, 0)).not.toMatch(/[ILOU]/)
    }
  })

  it('folds look-alike characters onto the same ticket', () => {
    // A host reading an ID aloud, or typing it in a hurry, must not be able to land
    // on a DIFFERENT valid ticket. O reads as 0; I and L read as 1.
    // Only the seed half uses the letter alphabet; the index half stays decimal, so
    // the substitution is applied there only.
    const [seedPart, indexPart] = formatTicketId(1234567, 3).split('-')
    const canonical = parseTicketId(`${seedPart}-${indexPart}`)
    const mistyped = (from: RegExp, to: string) =>
      parseTicketId(`${seedPart.replace(from, to)}-${indexPart}`)

    expect(seedPart).toMatch(/[01]/) // the substitutions below need something to hit
    expect(mistyped(/0/g, 'O')).toEqual(canonical)
    expect(mistyped(/1/g, 'I')).toEqual(canonical)
    expect(mistyped(/1/g, 'L')).toEqual(canonical)
  })

  it('rejects garbage instead of guessing', () => {
    // Guessing would verify the WRONG ticket, which is worse than an error.
    for (const bad of ['', 'ABC', '-4', 'ABC-', 'A B', 'ABC-XY', 'ABC-4-5']) {
      expect(parseTicketId(bad)).toBeNull()
    }
  })
})

describe('regenerating a ticket from its ID', () => {
  it('reproduces exactly the ticket the set generated', () => {
    const setSeed = 42
    const set = generateIdentifiedSet(6, setSeed)
    for (const entry of set) {
      expect(ticketFromId(entry.id)).toEqual(entry.ticket)
    }
  })

  it('does not depend on how big the original set was', () => {
    // The host may have printed 24 tickets; the verifier only ever gets one ID and
    // must not need to know the set size. This is the property that makes that safe.
    const setSeed = 7
    const small = generateSet(3, setSeed)
    const large = generateSet(30, setSeed)
    expect(large.slice(0, 3)).toEqual(small)
    expect(ticketFromRef({ setSeed, index: 2 })).toEqual(large[2])
  })

  it('gives different tickets for different indices', () => {
    const a = ticketFromRef({ setSeed: 99, index: 0 })
    const b = ticketFromRef({ setSeed: 99, index: 1 })
    expect(a).not.toEqual(b)
  })

  it('returns null for an unparseable ID', () => {
    expect(ticketFromId('nope')).toBeNull()
  })
})
