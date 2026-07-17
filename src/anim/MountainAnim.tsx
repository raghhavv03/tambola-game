// Abstract peak (Kailash-adjacent without depicting anything): a main
// triangle rising into place with a snowline drawing across it, and a fainter
// second ridge behind.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  WHITE_DIM,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

export function MountainAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* Background ridge, fainter and offset — only at intensity 2+ so the
          small accent stays a single clean shape. */}
      {intensity >= 2 && (
        <motion.path
          d="M8 168 L62 108 L106 168 Z"
          stroke={WHITE_DIM}
          strokeWidth="3"
          strokeLinejoin="round"
          animate={{ y: [24, 0], opacity: [0, 0.7] }}
          transition={{ duration: dur * 0.5, delay: dur * 0.15, ease: 'easeOut' }}
        />
      )}

      {/* Main peak rises from below and settles. */}
      <motion.path
        d="M30 168 L100 52 L170 168 Z"
        fill={AMBER}
        fillOpacity="0.18"
        stroke={AMBER}
        strokeWidth="5"
        strokeLinejoin="round"
        animate={{ y: [32, 0], opacity: [0, 1] }}
        transition={{ duration: dur * 0.5, ease: 'easeOut' }}
      />

      {/* Snowline zigzag draws across just under the summit. */}
      <motion.path
        d="M84 79 L100 52 L116 79 L107 90 L100 76 L91 89 Z"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, y: [32, 0] }}
        transition={{ duration: dur * 0.55, delay: dur * 0.1, ease: 'easeOut' }}
      />

      {/* Ground line anchors the composition. */}
      <motion.path
        d="M18 168 L182 168"
        stroke={WHITE_DIM}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.4, ease: 'easeOut' }}
      />
    </motion.svg>
  )
}
