// Abstract shankh: a spiral drawing itself outward (the shell's cross-section)
// with sound arcs blowing out of the open end. Geometry only.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  AMBER_SOFT,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

// Hand-built spiral: alternating half-circle arcs of growing radius, starting
// at the centre. Reads as a shell cross-section without tracing anything.
const SPIRAL =
  'M96 100 A6 6 0 1 1 108 100 A12 12 0 1 1 84 100 A20 20 0 1 1 124 100 A30 30 0 1 1 64 100'

export function ConchAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* The spiral draws from the centre out — the shell "forming". */}
      <motion.path
        d={SPIRAL}
        stroke={AMBER}
        strokeWidth="5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.55, ease: 'easeOut' }}
      />

      {/* The blow: sound arcs leaving the spiral's open end (bottom-left). */}
      <motion.path
        d="M56 122 Q40 138 44 158"
        stroke={AMBER_SOFT}
        strokeWidth="3"
        strokeLinecap="round"
        animate={{ x: [0, -8], y: [0, 8], opacity: [0, 0.9, 0] }}
        transition={{ duration: dur * 0.45, delay: dur * 0.4, ease: 'easeOut' }}
      />
      {intensity >= 2 && (
        <motion.path
          d="M44 110 Q24 130 30 156"
          stroke={AMBER_SOFT}
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ x: [0, -10], y: [0, 10], opacity: [0, 0.7, 0] }}
          transition={{ duration: dur * 0.5, delay: dur * 0.45, ease: 'easeOut' }}
        />
      )}
      {intensity >= 3 && (
        <motion.path
          d="M34 98 Q8 124 18 156"
          stroke={AMBER_SOFT}
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ x: [0, -12], y: [0, 12], opacity: [0, 0.5, 0] }}
          transition={{ duration: dur * 0.5, delay: dur * 0.5, ease: 'easeOut' }}
        />
      )}
    </motion.svg>
  )
}
