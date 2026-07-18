// The player's ticket screen — the /t route.
//
// ===================== THE AIRGAP LIVES HERE =====================
// This screen learns EVERYTHING it will ever know from the URL fragment it was
// opened with, and then nothing else. No fetch, no socket, no poll, no import of the
// caller or the host store. It does not know a game is in progress. It does not know
// a single number has been called.
//
// This file must never gain:
//   - the called-numbers list, or anything derived from it
//   - an auto-marked cell, a highlighted cell, a pulsing cell
//   - "you missed one", "1 away from Full House", or any other nudge
//
// The player hears the host, finds the number on their own ticket, and taps it. The
// matching happens in their head. That is the entire reason this app exists.
// `src/player/airgap.test.ts` enforces the structural half of this mechanically.
// =================================================================

import { useEffect, useState } from 'react'
import { ticketFromId, parseTicketId } from '../engine/ticketId'
import { ticketIdFromHash } from '../ticketLink'
import { loadMarks, saveMarks } from './marks'
import { TicketCell } from './TicketCell'

// Everything this screen knows: which ticket, and which cells the player has tapped.
// Kept as one object so the two can never drift apart — persisting ticket A's marks
// under ticket B's ID would silently corrupt both.
interface Session {
  ticketId: string | null
  marks: Set<number>
}

// Open a ticket: its ID, plus whatever marks this device already saved for it.
function openTicket(ticketId: string | null): Session {
  return {
    ticketId,
    marks: ticketId === null ? new Set() : loadMarks(ticketId),
  }
}

function BadLink({ reason }: { reason: string }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-neutral-950 p-8 text-center text-white">
      <p className="text-2xl font-bold">Can't open this ticket</p>
      <p className="text-neutral-400">{reason}</p>
      <p className="text-sm text-neutral-500">
        Ask the host to show you the QR code again.
      </p>
    </div>
  )
}

export function PlayerApp() {
  // On a first scan the marks start empty; after a reload they're the player's own
  // taps, restored from this device.
  const [session, setSession] = useState<Session>(() =>
    openTicket(ticketIdFromHash(window.location.hash)),
  )
  const { ticketId, marks } = session

  // Scanning a second QR while /t is already open changes only the URL fragment,
  // which does NOT reload the page. Without this listener the player would keep
  // staring at their previous ticket while the address bar claimed otherwise.
  useEffect(() => {
    function handleHashChange() {
      setSession(openTicket(ticketIdFromHash(window.location.hash)))
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Persist on every change. Writing the whole small set is simpler than tracking
  // deltas and there are at most 15 numbers in it.
  useEffect(() => {
    if (session.ticketId !== null) saveMarks(session.ticketId, session.marks)
  }, [session])

  if (ticketId === null) {
    return <BadLink reason="The link is missing its ticket code." />
  }
  if (parseTicketId(ticketId) === null) {
    return <BadLink reason={`"${ticketId}" isn't a valid ticket code.`} />
  }

  // Rebuilt from the ID alone — the same grid the host printed, derived, not fetched.
  const ticket = ticketFromId(ticketId)
  if (ticket === null) {
    return <BadLink reason="That ticket code couldn't be rebuilt." />
  }

  function mark(value: number) {
    setSession((previous) => ({
      ...previous,
      marks: new Set(previous.marks).add(value),
    }))
  }

  function unmark(value: number) {
    setSession((previous) => {
      const marks = new Set(previous.marks)
      marks.delete(value)
      return { ...previous, marks }
    })
  }

  return (
    <div className="flex h-dvh flex-col bg-neutral-950 text-white">
      <header className="flex items-baseline justify-between px-3 py-2">
        <span className="text-sm text-neutral-500">Your ticket</span>
        <span className="font-mono text-sm tracking-widest text-neutral-400">
          {ticketId}
        </span>
      </header>

      <main className="flex min-h-0 flex-1 items-center px-1.5">
        {/* 9 columns, 3 rows. Cells are taller than they are wide: the width is
            fixed by the format (9 across a phone), so the height is where the
            touch target gets big enough to hit reliably. */}
        <div
          className="grid w-full grid-cols-9 gap-1.5"
          style={{ gridTemplateRows: 'repeat(3, clamp(60px, 13vh, 110px))' }}
        >
          {ticket.flatMap((row, rowIndex) =>
            row.map((value, colIndex) => (
              <TicketCell
                key={`${rowIndex}-${colIndex}`}
                value={value}
                marked={value !== null && marks.has(value)}
                onMark={() => value !== null && mark(value)}
                onUnmark={() => value !== null && unmark(value)}
              />
            )),
          )}
        </div>
      </main>

      <footer className="px-4 py-3 text-center text-xs leading-relaxed text-neutral-500">
        Tap a number to mark it. Press and hold a marked number to clear it.
        <br />
        Shout your claim out loud — the host checks it.
      </footer>
    </div>
  )
}
