// Abstract aarti: a flame circling — the gesture itself. A small teardrop
// orbits once around a faint circular track, trail drawing behind it.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  AMBER_SOFT,
  WHITE_DIM,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

export function AartiAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* The orbit track, barely there. */}
      <circle cx="100" cy="100" r="48" stroke={WHITE_DIM} strokeWidth="1.5" opacity="0.5" />

      {/* Trail: the track lights up behind the flame as it sweeps. Rotated
          -90° so the draw starts at 12 o'clock where the flame starts. */}
      <motion.circle
        cx="100"
        cy="100"
        r="48"
        stroke={AMBER_SOFT}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, opacity: [0.9, 0.9, 0.3] }}
        transition={{ duration: dur * 0.65, delay: dur * 0.12, ease: 'easeInOut' }}
        style={{ rotate: -90, originX: '50%', originY: '50%' }}
      />

      {/* The flame: a teardrop riding the orbit — one full circle, done.
          The group rotates about the centre; the flame sits at the top. */}
      <motion.g
        animate={{ rotate: [0, 360] }}
        transition={{ duration: dur * 0.65, delay: dur * 0.12, ease: 'easeInOut' }}
        style={{ originX: '50%', originY: '50%' }}
      >
        <path
          d="M100 60 C95 52 97 44 100 38 C103 44 105 52 100 60 Z"
          fill={AMBER_SOFT}
          stroke={AMBER}
          strokeWidth="2"
        />
      </motion.g>

      {/* Hero: a second, inner orbit sweeping counter-phase. */}
      {intensity >= 3 && (
        <motion.g
          animate={{ rotate: [180, 540] }}
          transition={{ duration: dur * 0.65, delay: dur * 0.18, ease: 'easeInOut' }}
          style={{ originX: '50%', originY: '50%' }}
        >
          <circle cx="100" cy="72" r="4" fill={AMBER} />
        </motion.g>
      )}
    </motion.svg>
  )
}
