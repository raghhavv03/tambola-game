// Abstract damru (pellet drum): two triangles tip-to-tip rocking side to
// side, with sound arcs rippling outward. Geometry only.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER,
  AMBER_SOFT,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

export function DamruAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* The drum body rocks like it's being twisted. originX/originY keep
          the rotation centred on the waist of the hourglass. */}
      <motion.g
        animate={{ rotate: [0, -14, 11, -7, 0] }}
        transition={{ duration: dur * 0.8, ease: 'easeInOut' }}
        style={{ originX: '50%', originY: '50%' }}
      >
        {/* Top and bottom drum faces, meeting at a narrow waist. */}
        <path
          d="M66 58 L134 58 L104 98 L96 98 Z"
          fill={AMBER}
          fillOpacity="0.25"
          stroke={AMBER}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M96 102 L104 102 L134 142 L66 142 Z"
          fill={AMBER}
          fillOpacity="0.25"
          stroke={AMBER}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Pellet cords: a dot swinging out from each side of the waist. */}
        <circle cx="70" cy="92" r="5" fill={AMBER_SOFT} />
        <circle cx="130" cy="108" r="5" fill={AMBER_SOFT} />
      </motion.g>

      {/* Sound arcs ripple outward on both sides, staggered. */}
      <motion.path
        d="M52 72 Q34 100 52 128"
        stroke={AMBER_SOFT}
        strokeWidth="3"
        strokeLinecap="round"
        animate={{ x: [0, -10], opacity: [0, 0.9, 0] }}
        transition={{ duration: dur * 0.55, delay: dur * 0.15, ease: 'easeOut' }}
      />
      <motion.path
        d="M148 72 Q166 100 148 128"
        stroke={AMBER_SOFT}
        strokeWidth="3"
        strokeLinecap="round"
        animate={{ x: [0, 10], opacity: [0, 0.9, 0] }}
        transition={{ duration: dur * 0.55, delay: dur * 0.15, ease: 'easeOut' }}
      />
      {/* Hero calls get a second, farther pair of ripples. */}
      {intensity >= 3 && (
        <>
          <motion.path
            d="M36 62 Q12 100 36 138"
            stroke={AMBER_SOFT}
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ x: [0, -12], opacity: [0, 0.6, 0] }}
            transition={{ duration: dur * 0.6, delay: dur * 0.3, ease: 'easeOut' }}
          />
          <motion.path
            d="M164 62 Q188 100 164 138"
            stroke={AMBER_SOFT}
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ x: [0, 12], opacity: [0, 0.6, 0] }}
            transition={{ duration: dur * 0.6, delay: dur * 0.3, ease: 'easeOut' }}
          />
        </>
      )}
    </motion.svg>
  )
}
