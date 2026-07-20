// The called-numbers board. Traditional tambola caller boards lay out 1-90 as
// 9 rows of 10 — this is a board for the ROOM (host + everyone watching), not
// a player's own ticket, so highlighting called numbers here is fine. See
// CLAUDE.md's "THE AIRGAP" note: this is different from /t, which must never
// show which numbers have been called.
//
// Cell colors are the same board tokens the room display uses (set on the
// host screen's root) — the loader already contrast-validated both pairings.

interface NumberGridProps {
  called: Set<number>
}

const ALL_NUMBERS = Array.from({ length: 90 }, (_, i) => i + 1)

export function NumberGrid({ called }: NumberGridProps) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {ALL_NUMBERS.map((n) => {
        const isCalled = called.has(n)
        return (
          <div
            key={n}
            className={
              'flex aspect-square items-center justify-center rounded text-[10px] font-semibold sm:text-xs ' +
              (isCalled
                ? 'bg-(--board-called) text-(--board-called-text)'
                : 'bg-(--board-uncalled) text-(--board-uncalled-text)')
            }
          >
            {n}
          </div>
        )
      })}
    </div>
  )
}
