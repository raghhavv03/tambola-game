// The one button that matters. Big, bottom third, thumb-reachable. Manual only
// — nothing in this app calls draw() except a host tap here.
//
// btn-accent (index.css) is the app's one primary-action look; the text token
// pairing is contrast-validated by the theme loader.

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
      className="btn-accent w-full max-w-md cursor-pointer rounded-2xl py-6 text-3xl font-bold text-(--board-called-text) transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 sm:py-7 sm:text-4xl"
    >
      DRAW
    </button>
  )
}
