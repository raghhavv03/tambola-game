// Abstract diya: a shallow lamp bowl with a teardrop flame settling upright.
// The flame wobbles once — lit, not flickering forever (budget is 1.5s).

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  AMBER_SOFT,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

export function DiyaAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* Warm halo behind the flame — hero calls only. */}
      {intensity >= 3 && (
        <motion.circle
          cx="100"
          cy="88"
          fill={AMBER}
          animate={{ r: [8, 52], opacity: [0.3, 0] }}
          transition={{ duration: dur * 0.7, delay: dur * 0.2, ease: 'easeOut' }}
        />
      )}

      {/* The bowl: a shallow boat shape sliding up into place. */}
      <motion.path
        d="M52 116 Q100 152 148 116 L138 112 L62 112 Z"
        fill={AMBER}
        fillOpacity="0.25"
        stroke={AMBER}
        strokeWidth="4"
        strokeLinejoin="round"
        animate={{ y: [14, 0], opacity: [0, 1] }}
        transition={{ duration: dur * 0.4, ease: 'easeOut' }}
      />

      {/* The flame grows from the wick and wobbles once as it settles.
          originY at the base so it stretches upward, like a real flame. */}
      <motion.path
        d="M100 106 C88 90 94 70 100 56 C106 70 112 90 100 106 Z"
        fill={AMBER_SOFT}
        stroke={AMBER}
        strokeWidth="2"
        animate={{ scale: [0, 1.15, 0.92, 1], rotate: [0, -4, 3, 0] }}
        transition={{ duration: dur * 0.6, delay: dur * 0.18, ease: 'easeOut' }}
        style={{ originX: '50%', originY: '100%' }}
      />
    </motion.svg>
  )
}
