// Abstract kamal: petals unfolding from the base, centre outward. Each petal
// is one symmetric teardrop outline — no botanical tracing, just the form.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  AMBER_SOFT,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

// One upright petal anchored at the origin; instances are rotated about the
// flower's base point. Drawn once here, reused for every petal.
const PETAL = 'M0 0 C-14 -18 -14 -46 0 -60 C14 -46 14 -18 0 0 Z'

// Rotation angles fanning out from vertical, paired with the stagger order:
// centre petal first, then each ring outward.
const PETALS: Array<{ angle: number; order: number }> = [
  { angle: 0, order: 0 },
  { angle: -32, order: 1 },
  { angle: 32, order: 1 },
  { angle: -64, order: 2 },
  { angle: 64, order: 2 },
]

export function LotusAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* Base point sits low-centre; all petals grow out of it. */}
      {PETALS.map(({ angle, order }) => (
        <g key={angle} transform={`translate(100 132) rotate(${angle})`}>
          <motion.path
            d={PETAL}
            fill={AMBER}
            fillOpacity="0.2"
            stroke={AMBER}
            strokeWidth="3.5"
            animate={{ scale: [0, 1] }}
            transition={{
              duration: dur * 0.45,
              delay: dur * 0.1 * order,
              ease: 'easeOut',
            }}
            style={{ originX: '50%', originY: '100%' }}
          />
        </g>
      ))}

      {/* Hero: a faint outer pair widening the bloom. */}
      {intensity >= 3 &&
        [-88, 88].map((angle) => (
          <g key={angle} transform={`translate(100 132) rotate(${angle})`}>
            <motion.path
              d={PETAL}
              stroke={AMBER_SOFT}
              strokeWidth="2"
              animate={{ scale: [0, 1], opacity: [0, 0.6] }}
              transition={{ duration: dur * 0.45, delay: dur * 0.3, ease: 'easeOut' }}
              style={{ originX: '50%', originY: '100%' }}
            />
          </g>
        ))}

      {/* Centre seed dot pops last, completing the bloom. */}
      <motion.circle
        cx="100"
        cy="120"
        r="5"
        fill={AMBER_SOFT}
        animate={{ scale: [0, 1.4, 1] }}
        transition={{ duration: dur * 0.3, delay: dur * 0.35, ease: 'easeOut' }}
        style={{ originX: '50%', originY: '50%' }}
      />
    </motion.svg>
  )
}
