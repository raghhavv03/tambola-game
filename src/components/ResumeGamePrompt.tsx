// Shown once at startup when a saved game (src/store/persist.ts) is found —
// never silently: a host opening the app mid-party must see what they're
// about to resume before it happens, not inherit last week's game by
// accident. Same full-screen overlay pattern as VerifierPanel, but on top of
// it (z-70) since this gate runs before any other panel could be open.
//
// On the normal host path the HOME screen is this gate now (its Resume /
// Start-new buttons); this component still guards `?display=1` page loads,
// which skip home and go straight to the stage.

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
    <div className="fixed inset-0 z-70 flex flex-col items-center justify-center gap-6 bg-neutral-950 px-6 text-center text-white">
      <div>
        <h2 className="text-xl font-bold">Resume the last game?</h2>
        <p className="mt-2 text-sm text-neutral-400">
          {drawCount} number{drawCount === 1 ? '' : 's'} called, saved {savedAgo}.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onResume}
          className="rounded-xl bg-emerald-500 px-4 py-3 text-base font-bold text-neutral-950"
        >
          Resume game
        </button>
        <button
          type="button"
          onClick={onNewGame}
          className="rounded-xl bg-neutral-800 px-4 py-3 text-base font-semibold text-neutral-300"
        >
          Start new game
        </button>
      </div>
    </div>
  )
}
