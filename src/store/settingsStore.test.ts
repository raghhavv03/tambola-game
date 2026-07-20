import { describe, it, expect, beforeEach } from 'vitest'
import { installMockLocalStorage } from '../test/mockLocalStorage'
import { loadSettings } from './persist'

beforeEach(() => {
  installMockLocalStorage()
})

describe('settingsStore', () => {
  it('setters persist to localStorage', async () => {
    // Fresh import each test so the store re-reads storage at module init.
    const { useSettingsStore } = await import('./settingsStore')
    useSettingsStore.getState().setTtsEnabled(true)
    expect(useSettingsStore.getState().ttsEnabled).toBe(true)
    expect(loadSettings().ttsEnabled).toBe(true)
    useSettingsStore.getState().setReducedMotion(true)
    useSettingsStore.getState().setThemeId('mythology')
    expect(loadSettings()).toEqual({
      ttsEnabled: true,
      reducedMotion: true,
      themeId: 'mythology',
    })
  })
})
