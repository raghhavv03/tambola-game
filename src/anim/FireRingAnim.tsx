// Abstract agni: a ring of small flame triangles flaring outward, the whole
// ring turning slightly as it ignites. Geometry only.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  AMBER_SOFT,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

// Flame positions around the ring, precomputed per count. Each entry is the
// SVG transform that moves a flame to the rim and points it outward.
function flameTransforms(count: number, radius: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const deg = (i * 360) / count
    const rad = (deg * Math.PI) / 180
    const x = 100 + radius * Math.sin(rad)
    const y = 100 - radius * Math.cos(rad)
    return `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})`
  })
}

export function FireRingAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)
  const count = intensity >= 3 ? 10 : intensity === 2 ? 8 : 5

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      <motion.g
        animate={{ rotate: [0, 18] }}
        transition={{ duration: dur * 0.8, ease: 'easeOut' }}
        style={{ originX: '50%', originY: '50%' }}
      >
        {/* The ring itself ignites (draws) first... */}
        <motion.circle
          cx="100"
          cy="100"
          r="52"
          stroke={AMBER}
          strokeWidth="4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: dur * 0.45, ease: 'easeOut' }}
        />
        {/* ...then the flames lick outward around it, staggered. */}
        {flameTransforms(count, 52).map((transform, i) => (
          <g key={i} transform={transform}>
            <motion.path
              d="M-6 0 C-4 -8 0 -14 0 -20 C0 -14 4 -8 6 0 Z"
              fill={AMBER_SOFT}
              animate={{ scale: [0, 1.25, 1] }}
              transition={{
                duration: dur * 0.35,
                delay: dur * (0.25 + (i / count) * 0.25),
                ease: 'easeOut',
              }}
              style={{ originX: '50%', originY: '100%' }}
            />
          </g>
        ))}
        {/* Hero: an inner glow breathing once inside the ring. */}
        {intensity >= 3 && (
          <motion.circle
            cx="100"
            cy="100"
            fill={AMBER}
            animate={{ r: [20, 44], opacity: [0.25, 0] }}
            transition={{ duration: dur * 0.6, delay: dur * 0.3, ease: 'easeOut' }}
          />
        )}
      </motion.g>
    </motion.svg>
  )
}
