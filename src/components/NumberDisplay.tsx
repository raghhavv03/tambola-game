// The number the host reads out. Sized with clamp() rather than a fixed
// Tailwind text-size class so it scales continuously with the viewport and
// stays as large as fits, in both portrait and landscape.

interface NumberDisplayProps {
  currentNumber: number | null
  phrase: string | null
}

export function NumberDisplay({ currentNumber, phrase }: NumberDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 text-center">
      <div
        className="font-black leading-none text-white tabular-nums"
        // min(28vw, 16vh) keeps the number from overflowing a short
        // (landscape) viewport, since vw alone doesn't account for height.
        style={{ fontSize: 'clamp(3.5rem, min(28vw, 16vh), 18rem)' }}
      >
        {currentNumber ?? '—'}
      </div>
      {/* line-clamp-2 caps this at two lines and hides the rest rather than
          letting a long phrase push into the number grid below it on short
          (landscape) viewports. */}
      <p className="line-clamp-2 max-w-2xl text-sm text-amber-200 sm:text-xl">
        {phrase ?? 'Tap DRAW to start the game'}
      </p>
    </div>
  )
}
