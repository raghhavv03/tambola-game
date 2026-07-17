// The workhorse reaction: an abstract ring burst. Most calls land here, so it
// has to read as "something happened" without demanding attention.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  AMBER_SOFT,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

export function DefaultAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* Expanding ring — the core "ping". r animates as an SVG attribute. */}
      <motion.circle
        cx="100"
        cy="100"
        stroke={AMBER}
        strokeWidth="4"
        animate={{ r: [18, 88], opacity: [1, 0] }}
        transition={{ duration: dur * 0.85, ease: 'easeOut' }}
      />
      {/* Second, softer ring trails the first for a hint of depth. */}
      <motion.circle
        cx="100"
        cy="100"
        stroke={AMBER_SOFT}
        strokeWidth="2"
        animate={{ r: [14, 70], opacity: [0.8, 0] }}
        transition={{ duration: dur * 0.85, delay: dur * 0.12, ease: 'easeOut' }}
      />
      {/* Hero calls get a third ring so the burst fills the bigger stage. */}
      {intensity >= 3 && (
        <motion.circle
          cx="100"
          cy="100"
          stroke={AMBER}
          strokeWidth="1.5"
          animate={{ r: [10, 96], opacity: [0.6, 0] }}
          transition={{ duration: dur * 0.9, delay: dur * 0.2, ease: 'easeOut' }}
        />
      )}
      {/* Centre dot pops once, then the root fade takes it away. */}
      <motion.circle
        cx="100"
        cy="100"
        r="6"
        fill={AMBER}
        animate={{ scale: [0, 1.5, 1] }}
        transition={{ duration: dur * 0.5, ease: 'easeOut' }}
        style={{ originX: '50%', originY: '50%' }}
      />
    </motion.svg>
  )
}
