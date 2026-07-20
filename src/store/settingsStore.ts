// Host UI preferences: theme pack, speak-numbers (TTS), reduce-motion.
// Persisted to localStorage (tambola:host:settings) via persist.ts, disjoint
// from the game state and the player's marks. Host-only — never imported
// under src/player/.

import { create } from 'zustand'
import * as persist from './persist'

interface SettingsState {
  ttsEnabled: boolean
  reducedMotion: boolean
  /** Selected theme pack id; null means "never picked". Kept as a raw string
   *  here — the App resolves it against the registry (with a fallback to the
   *  first pack) so a stale id from a removed pack can't break the store. */
  themeId: string | null
  setTtsEnabled: (value: boolean) => void
  setReducedMotion: (value: boolean) => void
  setThemeId: (id: string) => void
}

// Read once at module load — the saved prefs (or their defaults).
const initial = persist.loadSettings()

// Persist the whole snapshot on every change so a partial write can never
// desync the fields.
function snapshot(state: SettingsState): persist.PersistedSettings {
  return {
    ttsEnabled: state.ttsEnabled,
    reducedMotion: state.reducedMotion,
    themeId: state.themeId,
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ttsEnabled: initial.ttsEnabled,
  reducedMotion: initial.reducedMotion,
  themeId: initial.themeId,

  setTtsEnabled: (value) =>
    set(() => {
      persist.saveSettings({ ...snapshot(get()), ttsEnabled: value })
      return { ttsEnabled: value }
    }),

  setReducedMotion: (value) =>
    set(() => {
      persist.saveSettings({ ...snapshot(get()), reducedMotion: value })
      return { reducedMotion: value }
    }),

  setThemeId: (id) =>
    set(() => {
      persist.saveSettings({ ...snapshot(get()), themeId: id })
      return { themeId: id }
    }),
}))
