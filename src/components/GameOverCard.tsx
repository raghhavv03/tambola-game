// Shown in place of the number card once all 90 are called — the game has a
// real ending now instead of a disabled button. No confirm on New Game here:
// a finished game has nothing left to lose.

import { TrophyIcon } from './icons'

interface GameOverCardProps {
  onNewGame: () => void
}

export function GameOverCard({ onNewGame }: GameOverCardProps) {
  return (
    <section className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-white/5 bg-(--stage-panel) px-6 py-10 text-center shadow-2xl shadow-black/40">
      <TrophyIcon className="h-12 w-12 text-(--stage-phrase)" />
      <div>
        <h2 className="font-display text-3xl font-black text-(--stage-number)">
          Game complete
        </h2>
        <p className="mt-1 text-sm text-(--stage-chrome)">
          All ninety numbers called.
        </p>
      </div>
      <button
        type="button"
        onClick={onNewGame}
        className="w-full max-w-60 cursor-pointer rounded-2xl px-4 py-3.5 text-lg font-bold text-(--board-called-text) transition active:scale-95"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in oklab, var(--board-called), white 12%), var(--board-called))',
          boxShadow:
            '0 8px 32px color-mix(in oklab, var(--board-called), transparent 65%)',
        }}
      >
        New game
      </button>
    </section>
  )
}
