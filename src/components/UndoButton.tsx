// Deliberately placed away from DRAW (top corner vs. bottom third) so a host
// can't mis-tap it mid-game and un-draw a number by accident.

import { UndoIcon } from './icons'

interface UndoButtonProps {
  onUndo: () => void
  disabled: boolean
}

export function UndoButton({ onUndo, disabled }: UndoButtonProps) {
  return (
    <button
      type="button"
      onClick={onUndo}
      disabled={disabled}
      aria-label="Undo last draw"
      className="flex h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/15 px-2.5 text-sm font-semibold text-(--stage-chrome) transition active:scale-95 disabled:opacity-30"
    >
      <UndoIcon />
      {/* Label folds away on narrow phones — the header must never clip. */}
      <span className="hidden sm:inline">Undo</span>
    </button>
  )
}
