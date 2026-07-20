import { describe, it, expect } from 'vitest'
import { langFromLocale } from './sound'

describe('langFromLocale', () => {
  it('drops a script subtag, keeping language + region', () => {
    expect(langFromLocale('hi-IN-latn')).toBe('hi-IN')
  })
  it('keeps a plain language-region tag', () => {
    expect(langFromLocale('en-IN')).toBe('en-IN')
  })
  it('keeps a bare language', () => {
    expect(langFromLocale('en')).toBe('en')
  })
  it('returns empty for empty', () => {
    expect(langFromLocale('')).toBe('')
  })
})
