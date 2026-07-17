// Full-screen overlay that plays one reaction per draw. pointer-events-none
// so DRAW stays tappable underneath; the reaction is decoration, never UI.
//
// Re-triggering works by remount: playKey changes once per draw, React swaps
// the subtree, and the new animation runs its course from its initial state.
// Finished reactions fade themselves out (root opacity envelope in each anim)
// and just sit invisible until the next draw replaces them.

import { useReducedMotion } from 'motion/react'
import { animRegistry } from '../anim/registry'

interface ReactionLayerProps {
  /** Component key, already resolved via theme.animations[call.anim]. Null
   *  before the first draw. */
  animKey: string | null
  intensity: number
  /** Changes only on draw (not undo) — see drawSeq in the store. */
  playKey: number | string
}

export function ReactionLayer({ animKey, intensity, playKey }: ReactionLayerProps) {
  // prefers-reduced-motion disables the whole layer. useReducedMotion is
  // reactive, so toggling the OS setting mid-game takes effect immediately.
  const reducedMotion = useReducedMotion()
  if (reducedMotion || animKey === null) return null

  // Theme validation guarantees every animations-map value is a registry key,
  // so this lookup cannot miss for a loaded theme.
  const Anim = animRegistry[animKey]

  return (
    <div
      key={playKey}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
    >
      <Anim intensity={intensity} />
    </div>
  )
}
