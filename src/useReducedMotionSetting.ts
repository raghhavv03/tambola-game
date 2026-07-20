// The effective "reduce motion" signal: the OS preference OR the host's own
// toggle. It can only ADD reduction — a user who wants motion still gets none if
// the OS asks for none. Host-only. Fed into DisplayMode's animation gate in
// place of a raw useReducedMotion() call.

import { useReducedMotion } from 'motion/react'
import { useSettingsStore } from './store/settingsStore'

export function useReducedMotionSetting(): boolean {
  const system = useReducedMotion() // OS "prefers-reduced-motion"
  const user = useSettingsStore((s) => s.reducedMotion)
  return Boolean(system) || user
}
