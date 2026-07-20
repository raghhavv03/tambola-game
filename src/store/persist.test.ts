import { describe, it, expect, vi, beforeEach } from 'vitest'
import { installMockLocalStorage, type MockLocalStorage } from '../test/mockLocalStorage'
import {
  saveGame,
  loadGame,
  clearGame,
  saveBogeys,
  loadBogeys,
  clearBogeys,
  saveSettings,
  loadSettings,
} from './persist'

let store: MockLocalStorage

beforeEach(() => {
  store = installMockLocalStorage()
})

describe('game persistence', () => {
  it('round-trips seed + history', () => {
    expect(saveGame(42, [7, 3, 9])).toBe(true)
    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.seed).toBe(42)
    expect(loaded!.history).toEqual([7, 3, 9])
    expect(typeof loaded!.savedAt).toBe('number')
  })

  it('loadGame returns null when nothing was saved', () => {
    expect(loadGame()).toBeNull()
  })

  it('loadGame returns null on malformed JSON', () => {
    store.setItem('tambola:host:game', '{not json')
    expect(loadGame()).toBeNull()
  })

  it('loadGame returns null when the shape is wrong', () => {
    store.setItem('tambola:host:game', JSON.stringify({ foo: 'bar' }))
    expect(loadGame()).toBeNull()
  })

  it('clearGame removes the saved game', () => {
    saveGame(1, [1])
    clearGame()
    expect(loadGame()).toBeNull()
  })

  it('saveGame returns false and warns when storage throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    store.failNextWrite()
    expect(saveGame(1, [1])).toBe(false)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('bogey persistence', () => {
  it('round-trips the tally', () => {
    expect(saveBogeys({ 'K3P9Z-04': 2 })).toBe(true)
    expect(loadBogeys()).toEqual({ 'K3P9Z-04': 2 })
  })

  it('loadBogeys returns {} when nothing was saved', () => {
    expect(loadBogeys()).toEqual({})
  })

  it('loadBogeys returns {} when the shape is wrong', () => {
    store.setItem('tambola:host:bogeys', JSON.stringify([1, 2, 3]))
    expect(loadBogeys()).toEqual({})
  })

  it('clearBogeys removes the saved tally', () => {
    saveBogeys({ X: 1 })
    clearBogeys()
    expect(loadBogeys()).toEqual({})
  })
})

describe('settings persistence', () => {
  it('round-trips all fields', () => {
    expect(
      saveSettings({ ttsEnabled: true, reducedMotion: true, themeId: 'plain' }),
    ).toBe(true)
    expect(loadSettings()).toEqual({
      ttsEnabled: true,
      reducedMotion: true,
      themeId: 'plain',
    })
  })

  it('returns defaults when nothing was saved', () => {
    expect(loadSettings()).toEqual({
      ttsEnabled: false,
      reducedMotion: false,
      themeId: null,
    })
  })

  it('returns defaults on malformed JSON', () => {
    store.setItem('tambola:host:settings', '{not json')
    expect(loadSettings()).toEqual({
      ttsEnabled: false,
      reducedMotion: false,
      themeId: null,
    })
  })

  it('degrades a bad field to its default, keeping the good ones', () => {
    // themeId absent (a pre-themeId save) also falls back to its default.
    store.setItem(
      'tambola:host:settings',
      JSON.stringify({ ttsEnabled: true, reducedMotion: 'yes' }),
    )
    expect(loadSettings()).toEqual({
      ttsEnabled: true,
      reducedMotion: false,
      themeId: null,
    })
  })
})
