// Composes gameStore.draw with the sound module: draw, then voice the phrase of
// the number that draw just produced — but only when the host has TTS on. Read
// from the store's getState() right after draw() so we get the fresh number
// synchronously (zustand set is synchronous). Host-only.
//
// Gating in the handler (not a useEffect on drawSeq) means undo never speaks and
// a resume that jumps drawSeq never speaks — only a real draw does.

import { useCallback } from 'react'
import { useGameStore } from './store/gameStore'
import { useSettingsStore } from './store/settingsStore'
import { speak, langFromLocale } from './sound'
import type { Theme } from './themes/types'

export function useDrawWithSound(theme: Theme): () => void {
  const draw = useGameStore((s) => s.draw)

  return useCallback(() => {
    draw()
    // Read TTS live (not via a subscription) so this callback stays stable and
    // the handler always sees the current preference.
    if (!useSettingsStore.getState().ttsEnabled) return
    const number = useGameStore.getState().currentNumber
    if (number === null) return
    const call = theme.calls[String(number)]
    if (!call) return
    speak(call.phrase, { lang: langFromLocale(theme.locale), audioUrl: call.audio })
  }, [draw, theme])
}
