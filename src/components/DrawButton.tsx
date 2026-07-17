// The one button that matters. Big, bottom third, thumb-reachable. Manual only
// — nothing in this app calls draw() except a host tap here.

interface DrawButtonProps {
  onDraw: () => void
  disabled: boolean
}

export function DrawButton({ onDraw, disabled }: DrawButtonProps) {
  return (
    <button
      type="button"
      onClick={onDraw}
      disabled={disabled}
      className="w-full max-w-md rounded-2xl bg-amber-500 py-7 text-4xl font-bold text-black shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 sm:py-8 sm:text-5xl"
    >
      {disabled ? 'GAME OVER' : 'DRAW'}
    </button>
  )
}
