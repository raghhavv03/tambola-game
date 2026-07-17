// Abstract "om" — no glyph tracing: a chandrabindu (crescent + dot) over
// expanding resonance rings, i.e. the sound itself rather than the character.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  AMBER_SOFT,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

export function OmAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* Resonance rings ripple outward from where the sound "sits". */}
      <motion.circle
        cx="100"
        cy="112"
        stroke={AMBER}
        strokeWidth="3"
        animate={{ r: [16, 62], opacity: [0.9, 0] }}
        transition={{ duration: dur * 0.7, ease: 'easeOut' }}
      />
      <motion.circle
        cx="100"
        cy="112"
        stroke={AMBER_SOFT}
        strokeWidth="2"
        animate={{ r: [12, 48], opacity: [0.8, 0] }}
        transition={{ duration: dur * 0.7, delay: dur * 0.15, ease: 'easeOut' }}
      />
      {intensity >= 3 && (
        <motion.circle
          cx="100"
          cy="112"
          stroke={AMBER}
          strokeWidth="1.5"
          animate={{ r: [10, 78], opacity: [0.6, 0] }}
          transition={{ duration: dur * 0.75, delay: dur * 0.25, ease: 'easeOut' }}
        />
      )}

      {/* Chandrabindu: upward-open crescent with a dot floating above. */}
      <motion.path
        d="M76 58 A26 26 0 0 0 124 58"
        stroke={AMBER}
        strokeWidth="5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.4, ease: 'easeOut' }}
      />
      <motion.circle
        cx="100"
        cy="40"
        r="6"
        fill={AMBER_SOFT}
        animate={{ scale: [0, 1.4, 1] }}
        transition={{ duration: dur * 0.4, delay: dur * 0.2, ease: 'easeOut' }}
        style={{ originX: '50%', originY: '50%' }}
      />
    </motion.svg>
  )
}
