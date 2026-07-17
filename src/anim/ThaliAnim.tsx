// Abstract thaal: a round plate landing with items arranged around the rim —
// concentric rings plus a circle of dots popping in.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  AMBER_SOFT,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

// Six item dots evenly spaced just inside the rim.
const DOTS = Array.from({ length: 6 }, (_, i) => {
  const a = (i * Math.PI) / 3 - Math.PI / 2 // start at 12 o'clock
  return {
    x: 100 + 44 * Math.cos(a),
    y: 100 + 44 * Math.sin(a),
  }
})

export function ThaliAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* Plate lands: scales in with a slight overshoot-settle. */}
      <motion.g
        animate={{ scale: [0.4, 1.06, 1] }}
        transition={{ duration: dur * 0.5, ease: 'easeOut' }}
        style={{ originX: '50%', originY: '50%' }}
      >
        <circle cx="100" cy="100" r="58" stroke={AMBER} strokeWidth="4" />
        <circle cx="100" cy="100" r="32" stroke={AMBER_SOFT} strokeWidth="2" />
      </motion.g>

      {/* Items pop around the rim one after another. */}
      {DOTS.map(({ x, y }, i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="5"
          fill={AMBER_SOFT}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{
            duration: dur * 0.25,
            delay: dur * (0.25 + i * 0.05),
            ease: 'easeOut',
          }}
          style={{ originX: '50%', originY: '50%' }}
        />
      ))}

      {/* Hero: a shimmer arc sweeping around the rim once. */}
      {intensity >= 3 && (
        <motion.circle
          cx="100"
          cy="100"
          r="66"
          stroke={AMBER}
          strokeWidth="2.5"
          strokeDasharray="30 380"
          strokeLinecap="round"
          animate={{ rotate: [0, 300], opacity: [0, 0.9, 0] }}
          transition={{ duration: dur * 0.6, delay: dur * 0.3, ease: 'easeOut' }}
          style={{ originX: '50%', originY: '50%' }}
        />
      )}
    </motion.svg>
  )
}
