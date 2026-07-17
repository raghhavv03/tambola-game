// Abstract dhanush: bow curve and string draw in, then an arrow releases and
// flies. The arrow leaving IS the moment — everything else is setup.

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

export function BowAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* Bow limb: a single arc, tips toward the string side (left). */}
      <motion.path
        d="M64 162 C124 128 124 72 64 38"
        stroke={AMBER}
        strokeWidth="5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.4, ease: 'easeOut' }}
      />
      {/* String connects the tips. */}
      <motion.path
        d="M64 162 L64 38"
        stroke={AMBER_SOFT}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.3, delay: dur * 0.15, ease: 'easeOut' }}
      />

      {/* The arrow: nocked at the string, releases to the right and fades as
          it exits — launch, not travel-forever. */}
      <motion.g
        animate={{ x: [0, 74], opacity: [0, 1, 1, 0] }}
        transition={{
          duration: dur * 0.45,
          delay: dur * 0.45,
          times: [0, 0.15, 0.75, 1],
          ease: 'easeIn',
        }}
      >
        <path
          d="M64 100 L128 100 M128 100 L114 92 M128 100 L114 108"
          stroke={AMBER}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Fletching notch at the tail. */}
        <path d="M64 100 L56 92 M64 100 L56 108" stroke={AMBER_SOFT} strokeWidth="3" strokeLinecap="round" />
      </motion.g>

      {/* Hero: a speed line trailing the arrow's path. */}
      {intensity >= 3 && (
        <motion.path
          d="M70 100 L150 100"
          stroke={WHITE_DIM}
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ x: [0, 40], opacity: [0, 0.7, 0] }}
          transition={{ duration: dur * 0.35, delay: dur * 0.55, ease: 'easeIn' }}
        />
      )}
    </motion.svg>
  )
}
