// Shown once at startup when a saved game (src/store/persist.ts) is found —
// never silently: a host opening the app mid-party must see what they're
// about to resume before it happens, not inherit last week's game by
// accident.
//
// On the normal host path the HOME screen is this gate now (its Resume /
// Start-new buttons); this component still guards `?display=1` page loads,
// which skip home and go straight to the stage. App wraps it in the display
// theme's stage variables, so it matches the stage it's about to show —
// same tokens, same btn-accent primary as every other screen.

import { formatRelativeTime } from '../relativeTime'

interface ResumeGamePromptProps {
  drawCount: number
  savedAt: number
  onResume: () => void
  onNewGame: () => void
}

export function ResumeGamePrompt({
  drawCount,
  savedAt,
  onResume,
  onNewGame,
}: ResumeGamePromptProps) {
  const savedAgo = formatRelativeTime(savedAt)

  return (
    <div className="fixed inset-0 z-70 flex flex-col items-center justify-center gap-6 px-6 text-center text-white">
      <div>
        <h2 className="font-display text-2xl font-bold text-(--stage-number)">
          Resume the last game?
        </h2>
        <p className="mt-2 text-sm text-(--stage-chrome)">
          {drawCount} number{drawCount === 1 ? '' : 's'} called, saved {savedAgo}.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onResume}
          className="btn-accent cursor-pointer rounded-2xl px-4 py-3.5 text-base font-bold text-(--board-called-text) transition active:scale-95"
        >
          Resume game
        </button>
        <button
          type="button"
          onClick={onNewGame}
          className="cursor-pointer rounded-2xl border border-white/5 bg-(--stage-panel) px-4 py-3 text-base font-semibold text-(--stage-number) transition active:scale-95"
        >
          Start new game
        </button>
      </div>
    </div>
  )
}
