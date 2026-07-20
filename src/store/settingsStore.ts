// Host UI preferences: speak-numbers (TTS) and reduce-motion. Persisted to
// localStorage (tambola:host:settings) via persist.ts, disjoint from the game
// state and the player's marks. Host-only — never imported under src/player/.

import { create } from 'zustand'
import * as persist from './persist'

interface SettingsState {
  ttsEnabled: boolean
  reducedMotion: boolean
  setTtsEnabled: (value: boolean) => void
  setReducedMotion: (value: boolean) => void
}

// Read once at module load — the saved prefs (or their defaults).
const initial = persist.loadSettings()

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ttsEnabled: initial.ttsEnabled,
  reducedMotion: initial.reducedMotion,

  setTtsEnabled: (value) =>
    set(() => {
      // Persist the whole snapshot so a partial write can never desync the two.
      persist.saveSettings({ ttsEnabled: value, reducedMotion: get().reducedMotion })
      return { ttsEnabled: value }
    }),

  setReducedMotion: (value) =>
    set(() => {
      persist.saveSettings({ ttsEnabled: get().ttsEnabled, reducedMotion: value })
      return { reducedMotion: value }
    }),
}))
