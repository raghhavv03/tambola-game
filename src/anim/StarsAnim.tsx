// Nakshatra / Saptarishi: seven four-point stars popping in one by one in the
// Big Dipper arrangement (a real constellation — fact, not IP), joined by a
// faint constellation line at higher intensities.

import { motion } from 'motion/react'
import {
  type AnimComponentProps,
  presetFor,
  AMBER_SOFT,
  WHITE_DIM,
  FADE_KEYFRAMES,
  FADE_TIMES,
} from './shared'

// A four-point star centred on (0,0); placed via <g transform>.
const STAR_PATH =
  'M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z'

// Rough Big Dipper layout, scaled into the 200x200 stage: bowl of four on
// the right, handle of three curving up-left.
const STARS: Array<[number, number]> = [
  [32, 62], // handle tip
  [58, 50],
  [84, 56], // handle joins bowl
  [108, 72],
  [104, 108], // bowl
  [142, 116],
  [152, 78],
]

export function StarsAnim({ intensity }: AnimComponentProps) {
  const { box, dur } = presetFor(intensity)
  // Stagger spread across roughly the first half of the budget, leaving the
  // second half for the hold-and-fade of the root envelope.
  const stagger = (dur * 0.45) / STARS.length

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: box, height: box }}
      fill="none"
      animate={FADE_KEYFRAMES}
      transition={{ duration: dur, times: FADE_TIMES, ease: 'easeOut' }}
    >
      {/* Constellation line traces through the stars after they appear. */}
      {intensity >= 2 && (
        <motion.path
          d="M32 62 L58 50 L84 56 L108 72 L104 108 L142 116 L152 78 L108 72"
          stroke={WHITE_DIM}
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: dur * 0.5, delay: dur * 0.25, ease: 'easeOut' }}
        />
      )}

      {STARS.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <motion.path
            d={STAR_PATH}
            fill={AMBER_SOFT}
            animate={{ scale: [0, 1.35, 1], opacity: [0, 1, 1] }}
            transition={{ duration: dur * 0.35, delay: i * stagger, ease: 'easeOut' }}
            style={{ originX: '50%', originY: '50%' }}
          />
        </g>
      ))}

      {/* Hero calls scatter a few extra pinprick stars around the field. */}
      {intensity >= 3 &&
        (
          [
            [24, 130],
            [66, 150],
            [170, 140],
            [178, 44],
            [120, 34],
          ] as Array<[number, number]>
        ).map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="2.5"
            fill={WHITE_DIM}
            animate={{ opacity: [0, 1, 0.4, 1] }}
            transition={{ duration: dur * 0.6, delay: dur * 0.3 + i * 0.05 }}
          />
        ))}
    </motion.svg>
  )
}
