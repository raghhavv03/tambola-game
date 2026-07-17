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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    if (lastDrawnAt === null) return
    const timer = setTimeout(() => setVisible(true), NUDGE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [lastDrawnAt])

  return (
    <p
      className="h-5 text-sm text-white/50 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      Next number?
    </p>
  )
}
