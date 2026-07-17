// Abstract hans: one S-curve for the neck, one arc for the body, ripple lines
// beneath — a swan implied by three strokes, gliding in.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  WHITE_DIM,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

export function SwanAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* The swan glides in from the left as its strokes draw. */}
      <motion.g
        animate={{ x: [-16, 0] }}
        transition={{ duration: dur * 0.7, ease: 'easeOut' }}
      >
        {/* Body: a low hull arc. */}
        <motion.path
          d="M62 118 Q98 146 134 116"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: dur * 0.4, ease: 'easeOut' }}
        />
        {/* Neck: S-curve rising from the body, ending in a beak hook. */}
        <motion.path
          d="M118 120 C118 94 98 90 98 68 C98 52 110 46 120 52"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: dur * 0.45, delay: dur * 0.15, ease: 'easeOut' }}
        />
        {/* Beak tip accent. */}
        <motion.path
          d="M120 52 L130 56"
          stroke={AMBER}
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: dur * 0.15, delay: dur * 0.55, ease: 'easeOut' }}
        />
      </motion.g>

      {/* Water: ripple lines drifting opposite the glide. */}
      <motion.path
        d="M52 148 Q72 142 92 148 T132 148"
        stroke={WHITE_DIM}
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, x: [8, 0] }}
        transition={{ duration: dur * 0.5, delay: dur * 0.2, ease: 'easeOut' }}
      />
      {intensity >= 2 && (
        <motion.path
          d="M68 162 Q88 156 108 162 T148 162"
          stroke={WHITE_DIM}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1, x: [12, 0], opacity: [0, 0.7] }}
          transition={{ duration: dur * 0.5, delay: dur * 0.3, ease: 'easeOut' }}
        />
      )}
    </motion.svg>
  )
}
