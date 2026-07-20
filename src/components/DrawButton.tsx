// The one button that matters. Big, bottom third, thumb-reachable. Manual only
// — nothing in this app calls draw() except a host tap here.
//
// Fill/text reuse the board's called-cell tokens: that pair is the theme's
// accent-on-dark pairing and the loader already holds it to a 4.5:1 floor,
// so the label stays readable in every pack. The gradient and glow are both
// mixed from the same accent, so they follow the theme for free.

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
      className="w-full max-w-md cursor-pointer rounded-2xl py-6 text-3xl font-bold text-(--board-called-text) transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 sm:py-7 sm:text-4xl"
      style={{
        // Slight top-light on the accent reads as depth without an image.
        background:
          'linear-gradient(180deg, color-mix(in oklab, var(--board-called), white 12%), var(--board-called))',
        boxShadow:
          '0 8px 32px color-mix(in oklab, var(--board-called), transparent 65%)',
      }}
    >
      DRAW
    </button>
  )
}
