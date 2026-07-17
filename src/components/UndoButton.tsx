// Deliberately small and placed away from DRAW (top corner vs. bottom third)
// so a host can't mis-tap it mid-game and un-draw a number by accident.

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
      className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60 transition active:scale-95 disabled:opacity-30"
    >
      Undo
    </button>
  )
}
