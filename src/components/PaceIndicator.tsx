// Fades in ~10s after the last draw, to nudge the host's rhythm if they've
// gone quiet. Never shows before the first draw, and resets on every
// draw/undo. This is a nudge, not a timer/autoplay — it never calls draw()
// itself; CLAUDE.md rules out any auto-call behavior.

import { useEffect, useState } from 'react'

interface PaceIndicatorProps {
  lastDrawnAt: number | null
}

const NUDGE_DELAY_MS = 10_000

export function PaceIndicator({ lastDrawnAt }: PaceIndicatorProps) {
  // WHICH draw the nudge has fired for, not whether it's showing. Storing the
  // timestamp instead of a boolean is what removes the reset: a new draw changes
  // lastDrawnAt, so the two stop matching and the nudge hides on that same render.
  // A boolean would have to be set back to false from inside the effect, which
  // costs an extra render pass every single draw.
  const [nudgedFor, setNudgedFor] = useState<number | null>(null)

  useEffect(() => {
    if (lastDrawnAt === null) return
    const timer = setTimeout(() => setNudgedFor(lastDrawnAt), NUDGE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [lastDrawnAt])

  // Derived, never stored: visible only while the fired nudge belongs to the draw
  // currently on screen. Null lastDrawnAt (nothing drawn yet) can never match.
  const visible = lastDrawnAt !== null && nudgedFor === lastDrawnAt

  return (
    <p
      className="h-5 text-sm text-(--stage-chrome) transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      Next number?
    </p>
  )
}
