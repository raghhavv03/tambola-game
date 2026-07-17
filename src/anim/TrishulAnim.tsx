// Abstract trident: three upward strokes drawing in, centre one tallest, with
// a crossbar. Pure geometry — no figures, no faces (see CLAUDE.md on IP and
// the pack guide on respectful abstraction).

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  AMBER_SOFT,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

// Stroke-draw helper: pathLength 0 -> 1 makes the line "draw itself".
const draw = (dur: number, delay: number) => ({
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: { duration: dur, delay, ease: 'easeOut' as const },
})

export function TrishulAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* Centre prong — straight, tallest, with an arrowhead tip. */}
      <motion.path
        d="M100 168 L100 52 M90 66 L100 48 L110 66"
        stroke={AMBER}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...draw(dur * 0.45, 0)}
      />
      {/* Side prongs — curve out from the shaft then rise. */}
      <motion.path
        d="M100 150 Q64 140 64 96 L64 70"
        stroke={AMBER}
        strokeWidth="5"
        strokeLinecap="round"
        {...draw(dur * 0.45, dur * 0.08)}
      />
      <motion.path
        d="M100 150 Q136 140 136 96 L136 70"
        stroke={AMBER}
        strokeWidth="5"
        strokeLinecap="round"
        {...draw(dur * 0.45, dur * 0.08)}
      />
      {/* Crossbar where the prongs meet the shaft. */}
      <motion.path
        d="M58 132 L142 132"
        stroke={AMBER_SOFT}
        strokeWidth="3"
        strokeLinecap="round"
        {...draw(dur * 0.3, dur * 0.2)}
      />
      {/* Hero-only glow pulse behind the whole form. */}
      {intensity >= 3 && (
        <motion.circle
          cx="100"
          cy="110"
          fill={AMBER}
          animate={{ r: [0, 70], opacity: [0.25, 0] }}
          transition={{ duration: dur * 0.7, delay: dur * 0.25, ease: 'easeOut' }}
        />
      )}
    </motion.svg>
  )
}
