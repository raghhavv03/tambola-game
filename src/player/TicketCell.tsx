// One tappable cell on a player's ticket.
//
// Marking is the whole point of this screen, so the interaction gets more care than
// a plain onClick would give it:
//
//   - a tap only counts if the finger barely moved (MOVE_TOLERANCE_PX). Otherwise
//     every attempt to scroll the ticket would mark whatever was under the thumb.
//   - marking is one quick tap. UNmarking needs a deliberate long press, because an
//     accidental unmark destroys information the app is forbidden to give back —
//     it must never tell the player what was called, so a wiped mark is gone.
//   - the mark lands with a spring and a short vibration. It should feel like
//     pressing a rubber stamp, not like toggling a checkbox.

import { useRef, useState } from 'react'
import { motion } from 'motion/react'

/** How far a finger may drift during a tap before we treat it as a scroll, not a tap. */
const MOVE_TOLERANCE_PX = 12
/** How long to hold a marked cell to clear it. Long enough to be deliberate. */
const UNMARK_HOLD_MS = 450

interface TicketCellProps {
  value: number | null
  marked: boolean
  onMark: () => void
  onUnmark: () => void
}

// Short buzz on a successful mark. Not supported on iOS Safari, hence the guard —
// it's a bonus, never the only feedback.
function buzz(ms: number) {
  if (typeof navigator.vibrate === 'function') navigator.vibrate(ms)
}

export function TicketCell({
  value,
  marked,
  onMark,
  onUnmark,
}: TicketCellProps) {
  // Where the finger went down, so we can measure drift on the way up.
  const startPoint = useRef<{ x: number; y: number } | null>(null)
  // The pending long-press timer, so we can cancel it if the finger leaves early.
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Set once the long press fires, so the following pointerup doesn't also act.
  const holdFired = useRef(false)
  // Drives the "keep holding" ring on a marked cell.
  const [holding, setHolding] = useState(false)

  // A blank square on the ticket. Not interactive, nothing to mark. Left empty
  // rather than tinted so the numbered cells clearly read as the tappable ones.
  if (value === null) {
    return <div aria-hidden="true" />
  }

  function cancelHold() {
    if (holdTimer.current !== null) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
    setHolding(false)
  }

  function handlePointerDown(event: React.PointerEvent) {
    startPoint.current = { x: event.clientX, y: event.clientY }
    holdFired.current = false

    // Only marked cells have a long-press action (clearing the mark).
    if (marked) {
      setHolding(true)
      holdTimer.current = setTimeout(() => {
        holdFired.current = true
        setHolding(false)
        buzz(25)
        onUnmark()
      }, UNMARK_HOLD_MS)
    }
  }

  function handlePointerMove(event: React.PointerEvent) {
    const start = startPoint.current
    if (start === null) return
    const drifted =
      Math.abs(event.clientX - start.x) > MOVE_TOLERANCE_PX ||
      Math.abs(event.clientY - start.y) > MOVE_TOLERANCE_PX
    if (drifted) {
      // This is a scroll, not a tap. Abandon both the tap and any pending hold.
      startPoint.current = null
      cancelHold()
    }
  }

  function handlePointerUp(event: React.PointerEvent) {
    const start = startPoint.current
    startPoint.current = null
    cancelHold()

    if (start === null) return // the finger drifted — treated as a scroll
    if (holdFired.current) return // the long press already unmarked this cell

    const drifted =
      Math.abs(event.clientX - start.x) > MOVE_TOLERANCE_PX ||
      Math.abs(event.clientY - start.y) > MOVE_TOLERANCE_PX
    if (drifted) return

    // A clean tap. Marks; never unmarks (that's the long press).
    if (!marked) {
      buzz(15)
      onMark()
    }
  }

  function handlePointerLeave() {
    startPoint.current = null
    cancelHold()
  }

  return (
    <button
      type="button"
      // touch-none: we handle pointer gestures ourselves, and it kills the 300ms
      // tap delay plus double-tap-to-zoom, both of which make marking feel laggy.
      className="relative flex touch-none items-center justify-center rounded-lg bg-neutral-800 text-2xl font-bold tabular-nums text-white select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()} // long press must not open the OS menu
      aria-pressed={marked}
      aria-label={marked ? `${value}, marked` : String(value)}
    >
      {/* The mark itself: the whole cell floods with colour, springing in from the
          middle. A disc was the first instinct, but these cells are tall and narrow
          (9 columns across a phone), so a circle reads as a sliver — filling the
          cell is what's unmistakable at arm's length. Rendered only when marked, so
          mounting and unmounting drive the animation. */}
      {marked && (
        <motion.span
          className="absolute inset-0 rounded-lg bg-amber-400"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 700, damping: 22 }}
        />
      )}

      {/* The "keep holding to clear" ring. Shrinks over the hold duration so the
          player can see the unmark coming and lift off to abort. */}
      {holding && (
        <motion.span
          className="absolute inset-0 rounded-lg border-4 border-red-400"
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: 0.9, scale: 0.82 }}
          transition={{ duration: UNMARK_HOLD_MS / 1000, ease: 'linear' }}
        />
      )}

      <motion.span
        className={`relative ${marked ? 'text-neutral-900' : ''}`}
        // A small pop on the number itself, keyed to the marked state.
        animate={{ scale: marked ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 18 }}
      >
        {value}
      </motion.span>
    </button>
  )
}
