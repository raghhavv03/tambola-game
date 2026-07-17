// Abstract chakra: a spoked wheel spinning into place. Rim, eight spokes,
// hub — geometry only.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  AMBER_SOFT,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

// Eight spokes from the hub (r=18) to just inside the rim (r=50), one path
// string built once at module load — no per-render work.
const SPOKES = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4
  const x1 = 100 + 18 * Math.cos(a)
  const y1 = 100 + 18 * Math.sin(a)
  const x2 = 100 + 50 * Math.cos(a)
  const y2 = 100 + 50 * Math.sin(a)
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`
}).join(' ')

export function ChakraAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* The whole wheel spins as it scales in — arriving, not just appearing. */}
      <motion.g
        animate={{ rotate: [-120, 40], scale: [0.5, 1] }}
        transition={{ duration: dur * 0.65, ease: 'easeOut' }}
        style={{ originX: '50%', originY: '50%' }}
      >
        <circle cx="100" cy="100" r="55" stroke={AMBER} strokeWidth="5" />
        <path d={SPOKES} stroke={AMBER_SOFT} strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="100" r="11" stroke={AMBER} strokeWidth="4" />
        {/* Hero: serrated outer edge suggested by a dashed second rim. */}
        {intensity >= 3 && (
          <circle
            cx="100"
            cy="100"
            r="64"
            stroke={AMBER}
            strokeWidth="3"
            strokeDasharray="6 10"
            strokeLinecap="round"
          />
        )}
      </motion.g>
    </motion.svg>
  )
}
