import { describe, it, expect } from 'vitest'
import { validateTheme, contrastRatio, CONTRAST_FLOORS } from './loader'
import { MILESTONE_KEYS } from './types'
// Real packs double as test fixtures: if either ever goes structurally bad,
// these tests catch it before the app crashes at startup.
import mythology from '../../themes/mythology.json'
import plain from '../../themes/plain.json'

// Build a minimal-but-valid pack we can break one field at a time. Note what it
// does NOT contain: no accent, no display block, no anim data of any kind — a
// pack with none of those must load fine.
function makeValidPack() {
  const calls: Record<string, object> = {}
  for (let n = 1; n <= 90; n++) {
    calls[String(n)] = {
      phrase: `Number ${n}.`,
      sub: String(n),
    }
  }
  const milestones: Record<string, object> = {}
  for (const key of MILESTONE_KEYS) {
    milestones[key] = { phrase: `${key}!` }
  }
  return {
    id: 'test',
    name: 'Test',
    locale: 'en',
    description: 'test pack',
    milestones,
    calls,
  }
}

// A display block whose every pair clears its floor comfortably.
function makeValidDisplay() {
  return {
    background: '#1C0F06',
    backdrop: '#070301',
    number: '#FFF5E6',
    halo: '#FF9933',
    phrase: '#FFB03B',
    panel: '#2A1708',
    boardCalled: '#FF9933',
    boardCalledText: '#1C0F06',
    boardUncalled: '#2A1708',
    boardUncalledText: '#D9A96A',
    ring: '#FFE8C7',
    chrome: '#C69C6D',
  }
}

describe('validateTheme', () => {
  it('accepts the shipped mythology pack', () => {
    expect(validateTheme(mythology, 'mythology.json').id).toBe('mythology')
  })

  it('accepts the shipped plain pack', () => {
    expect(validateTheme(plain, 'plain.json').id).toBe('plain')
  })

  it('accepts a minimal pack with zero anim data present', () => {
    // The reaction layer is gone; a pack is calls + milestones + metadata and
    // nothing else. This is the regression guard for that removal.
    expect(validateTheme(makeValidPack(), 'test').id).toBe('test')
  })

  it('ignores stray legacy anim fields instead of rejecting them', () => {
    // An old pack floating around with anim leftovers should still load —
    // validation probes known fields; it doesn't inventory the whole object.
    const pack = makeValidPack() as Record<string, unknown>
    pack.animations = { default: 'default' }
    ;((pack.calls as Record<string, object>)['7'] as Record<string, unknown>).anim = 'om'
    expect(validateTheme(pack, 'test').id).toBe('test')
  })

  it('rejects non-objects outright', () => {
    expect(() => validateTheme(null, 'test')).toThrow('not a JSON object')
    expect(() => validateTheme('nope', 'test')).toThrow('not a JSON object')
  })

  it('rejects a pack missing a call key', () => {
    const pack = makeValidPack()
    delete (pack.calls as Record<string, object>)['47']
    expect(() => validateTheme(pack, 'test')).toThrow('calls missing "47"')
  })

  it('rejects a pack missing a milestone', () => {
    const pack = makeValidPack()
    delete (pack.milestones as Record<string, object>)['fullHouse']
    expect(() => validateTheme(pack, 'test')).toThrow('milestones missing "fullHouse"')
  })

  it('accepts a valid accent and a pack with no accent at all', () => {
    const withAccent = { ...makeValidPack(), accent: '#FF9933' }
    expect(validateTheme(withAccent, 'test').accent).toBe('#FF9933')
    expect(validateTheme(makeValidPack(), 'test').accent).toBeUndefined()
  })

  it('rejects a malformed accent instead of silently falling back', () => {
    for (const bad of ['orange', '#F93', '#FF99331', 'FF9933', 12345]) {
      const pack = { ...makeValidPack(), accent: bad }
      expect(() => validateTheme(pack, 'test')).toThrow(
        '"accent" must be a "#rrggbb" hex color',
      )
    }
  })

  it('reports every problem in one error, not just the first', () => {
    const pack = makeValidPack()
    delete (pack.calls as Record<string, object>)['1']
    delete (pack.calls as Record<string, object>)['90']
    delete (pack.milestones as Record<string, object>)['earlyFive']
    expect(() => validateTheme(pack, 'test')).toThrow(/3 problem\(s\)/)
  })
})

describe('display token validation', () => {
  it('accepts a full valid display block', () => {
    const pack = { ...makeValidPack(), display: makeValidDisplay() }
    expect(validateTheme(pack, 'test').display?.background).toBe('#1C0F06')
  })

  it('accepts a display block without the optional tokens', () => {
    const display = makeValidDisplay() as Record<string, unknown>
    for (const optional of ['backdrop', 'halo', 'panel', 'ring', 'chrome']) {
      delete display[optional]
    }
    const pack = { ...makeValidPack(), display }
    expect(validateTheme(pack, 'test').id).toBe('test')
  })

  it('rejects a display block missing a required token', () => {
    const display = makeValidDisplay() as Record<string, unknown>
    delete display.number
    const pack = { ...makeValidPack(), display }
    expect(() => validateTheme(pack, 'test')).toThrow(
      'display["number"] must be a "#rrggbb" hex color',
    )
  })

  it('rejects an unknown display token — a typo must not silently fall back', () => {
    const display = { ...makeValidDisplay(), backgorund: '#000000' }
    const pack = { ...makeValidPack(), display }
    expect(() => validateTheme(pack, 'test')).toThrow(
      'display["backgorund"] is not a recognized display token',
    )
  })

  it('rejects a background that pushes the number under the contrast floor', () => {
    // Warm mid-brown behind warm ivory: pretty, and unreadable from 4 metres.
    const display = { ...makeValidDisplay(), background: '#8A6A4A' }
    const pack = { ...makeValidPack(), display }
    expect(() => validateTheme(pack, 'test')).toThrow(
      /number on background is \d+\.\d+:1, floor is 7:1/,
    )
  })

  it('rejects low-contrast board pairings too', () => {
    // Called-cell numeral nearly the same tone as its fill.
    const display = {
      ...makeValidDisplay(),
      boardCalled: '#FF9933',
      boardCalledText: '#E08020',
    }
    const pack = { ...makeValidPack(), display }
    expect(() => validateTheme(pack, 'test')).toThrow(
      /boardCalledText on boardCalled is \d+\.\d+:1/,
    )
  })

  it('shipped mythology display clears every floor with margin', () => {
    // Belt and braces: recompute the shipped palette's ratios directly, so a
    // future color tweak that lands exactly at a floor gets noticed here.
    const d = (mythology as { display: Record<string, string> }).display
    expect(contrastRatio(d.number, d.background)).toBeGreaterThan(
      CONTRAST_FLOORS.number,
    )
    expect(contrastRatio(d.phrase, d.background)).toBeGreaterThan(
      CONTRAST_FLOORS.phrase,
    )
    expect(contrastRatio(d.boardCalledText, d.boardCalled)).toBeGreaterThan(
      CONTRAST_FLOORS.boardCalledText,
    )
    expect(contrastRatio(d.boardUncalledText, d.boardUncalled)).toBeGreaterThan(
      CONTRAST_FLOORS.boardUncalledText,
    )
  })
})

describe('contrastRatio', () => {
  it('matches known WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
    // Symmetry: order of arguments must not matter.
    expect(contrastRatio('#123456', '#fedcba')).toBeCloseTo(
      contrastRatio('#fedcba', '#123456'),
      10,
    )
  })
})
