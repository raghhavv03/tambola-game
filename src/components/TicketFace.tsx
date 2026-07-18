// A ticket drawn read-only, for the HOST's eyes: on the print sheet and in the claim
// verifier. Not interactive — the only tappable ticket in this app is the player's
// own, on /t.
//
// `calledNumbers` is optional and used exclusively by the verifier, where showing
// which of a ticket's 15 numbers have actually come out is the entire point. It is
// never passed on the player's side; that would be the app doing the matching.

import type { Ticket } from '../engine/ticket'

interface TicketFaceProps {
  ticket: Ticket
  /** Host-side only: numbers to show as already called. */
  calledNumbers?: Set<number>
  /** 'screen' = dark UI. 'print' = black on white, cell sized for a pen. */
  variant?: 'screen' | 'print'
}

export function TicketFace({
  ticket,
  calledNumbers,
  variant = 'screen',
}: TicketFaceProps) {
  const isPrint = variant === 'print'

  return (
    <div
      className={`grid grid-cols-9 ${isPrint ? 'gap-0' : 'gap-0.5'}`}
      // Printed rows are 11mm tall: enough for an adult to strike a number with a
      // pen without hitting its neighbour. Screen rows just need to be readable.
      style={{
        gridTemplateRows: isPrint ? 'repeat(3, 11mm)' : 'repeat(3, 1.6rem)',
      }}
    >
      {ticket.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => {
          const called = value !== null && calledNumbers?.has(value) === true

          if (isPrint) {
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="flex items-center justify-center border border-black text-base font-semibold tabular-nums"
              >
                {value ?? ''}
              </div>
            )
          }

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`flex items-center justify-center rounded text-sm font-semibold tabular-nums ${
                value === null
                  ? 'bg-neutral-900/60'
                  : called
                    ? 'bg-emerald-500 text-neutral-950'
                    : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {value ?? ''}
            </div>
          )
        }),
      )}
    </div>
  )
}
