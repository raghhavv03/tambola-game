// The last few calls before the current one — for the host to re-announce when
// someone shouts "what was before that?". Fixed five slots so the row never
// reflows mid-game; empty slots render a faint dot, same trick as the room
// display's RecentCalls.

interface RecentNumbersProps {
  history: number[]
}

export function RecentNumbers({ history }: RecentNumbersProps) {
  // Everything before the current number, newest first, top five.
  const recent = history.slice(0, -1).slice(-5).reverse()

  return (
    <div className="w-full max-w-md">
      <p className="mb-1.5 text-[0.65rem] font-semibold tracking-[0.25em] text-(--stage-chrome) uppercase">
        Earlier
      </p>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((slot) => {
          const n = recent[slot]
          return (
            <div
              key={slot}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/5 bg-(--stage-panel) text-base font-bold text-(--stage-number) tabular-nums"
              // Newest reads strongest; the fade encodes order without labels.
              style={{ opacity: n !== undefined ? 1 - slot * 0.16 : 0.3 }}
            >
              {n ?? '·'}
            </div>
          )
        })}
      </div>
    </div>
  )
}
