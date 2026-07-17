// Dev/QA harness for the reaction layer, reachable at /?anim. Not a player
// surface and not part of the game flow — it exists because reactions last
// under 1.5s and there's no way to review them by drawing random numbers.
// Also useful when QA-ing a new theme pack's intensity choices.

import { useState } from 'react'
import { animRegistry } from '../anim/registry'
import { ReactionLayer } from './ReactionLayer'

export function AnimPreview() {
  const [animKey, setAnimKey] = useState<string | null>(null)
  const [intensity, setIntensity] = useState(3)
  // Bump to replay the same animation — mirrors drawSeq in the real store.
  const [seq, setSeq] = useState(0)

  const play = (key: string) => {
    setAnimKey(key)
    setSeq((s) => s + 1)
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-neutral-950 text-white">
      <p className="text-xs tracking-widest text-white/40 uppercase">
        Reaction preview — not a game screen
      </p>

      <div className="flex gap-2">
        {[1, 2, 3].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setIntensity(level)}
            className={
              'rounded px-3 py-1 text-sm ' +
              (intensity === level
                ? 'bg-amber-500 text-black'
                : 'bg-white/10 text-white/60')
            }
          >
            intensity {level}
          </button>
        ))}
      </div>

      <div className="flex max-w-md flex-wrap justify-center gap-2">
        {Object.keys(animRegistry).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => play(key)}
            className="rounded border border-white/20 px-3 py-2 text-sm text-white/80 active:bg-white/10"
          >
            {key}
          </button>
        ))}
      </div>

      <ReactionLayer
        animKey={animKey}
        intensity={intensity}
        playKey={`${animKey}-${intensity}-${seq}`}
      />
    </div>
  )
}
