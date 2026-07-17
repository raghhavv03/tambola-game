// Abstract mor: a tail-fan of feather stems opening from a base point, each
// tipped with an "eye" dot. Fan and dots — no bird drawn.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  AMBER_SOFT,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

// Fan angles from vertical; wider spread at higher intensity.
function fanAngles(count: number): number[] {
  const spread = 120 // total degrees across the fan
  const step = spread / (count - 1)
  return Array.from({ length: count }, (_, i) => -spread / 2 + i * step)
}

export function PeacockAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)
  const count = intensity >= 3 ? 7 : intensity === 2 ? 5 : 3
  const angles = fanAngles(count)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {angles.map((angle, i) => {
        // Stagger opens the fan centre-out, like a tail spreading.
        const order = Math.abs(i - (count - 1) / 2)
        return (
          <g key={angle} transform={`translate(100 156) rotate(${angle})`}>
            {/* Feather stem grows outward... */}
            <motion.path
              d="M0 0 L0 -84"
              stroke={AMBER}
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: dur * 0.4,
                delay: dur * 0.08 * order,
                ease: 'easeOut',
              }}
            />
            {/* ...and the eye pops at the tip: ring + dot. */}
            <motion.circle
              cx="0"
              cy="-92"
              r="7"
              stroke={AMBER_SOFT}
              strokeWidth="2.5"
              animate={{ scale: [0, 1.3, 1] }}
              transition={{
                duration: dur * 0.3,
                delay: dur * (0.3 + 0.08 * order),
                ease: 'easeOut',
              }}
              style={{ originX: '50%', originY: '50%' }}
            />
            <motion.circle
              cx="0"
              cy="-92"
              r="2.5"
              fill={AMBER}
              animate={{ scale: [0, 1] }}
              transition={{
                duration: dur * 0.25,
                delay: dur * (0.35 + 0.08 * order),
                ease: 'easeOut',
              }}
              style={{ originX: '50%', originY: '50%' }}
            />
          </g>
        )
      })}
    </motion.svg>
  )
}
