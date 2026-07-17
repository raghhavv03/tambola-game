import { describe, it, expect } from 'vitest'
import { validateTheme } from './loader'
import { MILESTONE_KEYS } from './types'
// Real packs double as test fixtures: if either ever goes structurally bad,
// these tests catch it before the app crashes at startup.
import mythology from '../../themes/mythology.json'
import plain from '../../themes/plain.json'

// Build a minimal-but-valid pack we can break one field at a time.
function makeValidPack() {
  const calls: Record<string, object> = {}
  for (let n = 1; n <= 90; n++) {
    calls[String(n)] = {
      phrase: `Number ${n}.`,
      sub: String(n),
      anim: 'default',
      intensity: 1,
    }
  }
  const milestones: Record<string, object> = {}
  for (const key of MILESTONE_KEYS) {
    milestones[key] = { phrase: `${key}!`, anim: 'default' }
  }
  return {
    id: 'test',
    name: 'Test',
    locale: 'en',
    description: 'test pack',
    animations: { default: 'anim/test/default.json' },
    milestones,
    calls,
  }
}

describe('validateTheme', () => {
  it('accepts the shipped mythology pack', () => {
    expect(validateTheme(mythology, 'mythology.json').id).toBe('mythology')
  })

  it('accepts the shipped plain pack', () => {
    expect(validateTheme(plain, 'plain.json').id).toBe('plain')
  })

  it('accepts a minimal valid pack', () => {
    expect(validateTheme(makeValidPack(), 'test').id).toBe('test')
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

  it('rejects an anim key that does not resolve in the animations map', () => {
    const pack = makeValidPack()
    ;(pack.calls['12'] as { anim: string }).anim = 'ghost'
    expect(() => validateTheme(pack, 'test')).toThrow(
      'calls["12"]: anim "ghost" not found',
    )
  })

  it('rejects a milestone anim that does not resolve', () => {
    const pack = makeValidPack()
    ;(pack.milestones['corners'] as { anim: string }).anim = 'ghost'
    expect(() => validateTheme(pack, 'test')).toThrow(
      'milestones["corners"]: anim "ghost" not found',
    )
  })

  it('rejects an out-of-range intensity', () => {
    const pack = makeValidPack()
    ;(pack.calls['5'] as { intensity: number }).intensity = 7
    expect(() => validateTheme(pack, 'test')).toThrow(
      'calls["5"]: "intensity" must be 1, 2, or 3',
    )
  })

  it('reports every problem in one error, not just the first', () => {
    const pack = makeValidPack()
    delete (pack.calls as Record<string, object>)['1']
    delete (pack.calls as Record<string, object>)['90']
    delete (pack.milestones as Record<string, object>)['earlyFive']
    expect(() => validateTheme(pack, 'test')).toThrow(/3 problem\(s\)/)
  })
})
