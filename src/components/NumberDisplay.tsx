// The number the host reads out — now a proper stage card: overline label,
// the number inside a dashed accent ring, and the themed phrase in a pill
// beneath. All colors come from the stage tokens set on the App root, so the
// active theme paints this exactly like the room display — no theme knowledge
// in here.

import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useReducedMotionSetting } from '../useReducedMotionSetting'

interface NumberDisplayProps {
  currentNumber: number | null
  phrase: string | null
  /** Increments per draw — keys the entrance animation so it replays. */
  drawSeq: number
}

export function NumberDisplay({ currentNumber, phrase, drawSeq }: NumberDisplayProps) {
  const reducedMotion = useReducedMotionSetting()

  // Same firm no-overshoot spring as the room display — one motion voice.
  const entrance = useMemo(
    () =>
      reducedMotion
        ? {}
        : {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            transition: { type: 'spring' as const, stiffness: 320, damping: 30 },
          },
    [reducedMotion],
  )

  return (
    <section className="flex w-full max-w-md flex-col items-center rounded-3xl border border-white/5 bg-(--stage-panel) px-6 py-5 text-center shadow-2xl shadow-black/40">
      <p
        className="text-[0.65rem] font-semibold tracking-[0.25em] text-(--stage-chrome) uppercase"
      >
        Current number
      </p>

      {/* The ring is scenery, not information — dashed, accent-tinted, and the
          number's contrast never depends on it. */}
      <div
        className="mt-3 flex aspect-square items-center justify-center rounded-full border-2 border-dashed"
        style={{
          width: 'clamp(10rem, min(52vw, 30vh), 14rem)',
          borderColor:
            'color-mix(in oklab, var(--board-called), transparent 55%)',
        }}
      >
        <motion.span
          key={drawSeq}
          {...entrance}
          className="font-display font-black leading-none text-(--stage-number)"
          style={{
            fontSize: 'clamp(4rem, min(24vw, 14vh), 6.5rem)',
            textShadow: '0 0 2.5rem var(--stage-halo)',
          }}
        >
          {currentNumber ?? '—'}
        </motion.span>
      </div>

      {/* Reserved height so a phrase appearing/disappearing never jumps the
          card; line-clamp-2 keeps epics from swallowing the layout. */}
      <p
        className="mt-4 line-clamp-2 min-h-[2.6em] max-w-full rounded-full px-4 py-1.5 text-sm leading-snug font-semibold text-(--stage-phrase) sm:text-base"
        style={{
          background: 'color-mix(in oklab, var(--board-called), transparent 88%)',
        }}
      >
        {phrase ?? 'Tap DRAW to start the game'}
      </p>
    </section>
  )
}
