// The primary delivery path: one QR per ticket, on the host's screen.
//
// A player points their camera at a code and their ticket appears. Nothing is sent
// anywhere — the QR encodes a URL whose fragment IS the ticket (see ticketLink.ts),
// so the player's phone rebuilds the grid locally from the recipe it just scanned.
// That's why this works with no backend, and why /t can stay airgapped.

import { useState } from 'react'
import { useTicketSetStore } from '../store/ticketSetStore'
import { useClaimStore } from '../store/claimStore'
import { ticketUrl } from '../ticketLink'
import { QrCode } from './QrCode'

interface TicketsPanelProps {
  onClose: () => void
  onPrint: () => void
}

// A phone on the wifi can't open "localhost" — that name means the phone itself.
// The host needs to be serving on a LAN address for the QR to be scannable at all,
// so say it plainly rather than letting them discover it with a room full of guests.
function isUnreachableFromPhones(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export function TicketsPanel({ onClose, onPrint }: TicketsPanelProps) {
  const tickets = useTicketSetStore((s) => s.tickets)
  const count = useTicketSetStore((s) => s.count)
  const setCount = useTicketSetStore((s) => s.setCount)
  const regenerate = useTicketSetStore((s) => s.regenerate)
  const bogeys = useClaimStore((s) => s.bogeys)

  // Which ticket's link was just copied, so we can show a brief confirmation.
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const origin = window.location.origin

  async function copyLink(id: string) {
    try {
      await navigator.clipboard.writeText(ticketUrl(origin, id))
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1200)
    } catch {
      // Clipboard blocked (non-HTTPS origins on some browsers). The QR still works.
    }
  }

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-neutral-950 text-white">
      <header className="sticky top-0 flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950 px-4 py-3">
        <h2 className="text-lg font-bold">Tickets</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold"
        >
          Close
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-neutral-400">How many</span>
          <input
            type="number"
            min={1}
            max={60}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-20 rounded-lg bg-neutral-800 px-3 py-2 tabular-nums"
          />
        </label>

        <button
          type="button"
          onClick={regenerate}
          className="rounded-lg bg-neutral-800 px-4 py-2 font-semibold"
        >
          New batch
        </button>

        {/* Offered, not pushed: paper is a second option sitting quietly next to
            the QR codes, for the players who'd rather have a pen. */}
        <button
          type="button"
          onClick={onPrint}
          className="rounded-lg bg-neutral-800 px-4 py-2 font-semibold"
        >
          Print on paper
        </button>
      </div>

      {isUnreachableFromPhones(window.location.hostname) && (
        <p className="mx-4 mb-3 rounded-lg bg-amber-500/15 px-3 py-2 text-sm text-amber-300">
          These codes point at <span className="font-mono">{origin}</span>, which
          only works on this machine. Serve on your network address
          (<span className="font-mono">npm run dev -- --host</span>) before handing
          tickets out.
        </p>
      )}

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 px-4 pb-8">
        {tickets.map((entry) => {
          const bogeyCount = bogeys[entry.id] ?? 0
          return (
            <li
              key={entry.id}
              className="flex flex-col items-center gap-2 rounded-xl bg-neutral-900 p-3"
            >
              <QrCode value={ticketUrl(origin, entry.id)} size={132} />
              <button
                type="button"
                onClick={() => void copyLink(entry.id)}
                className="font-mono text-sm tracking-widest text-neutral-300"
              >
                {copiedId === entry.id ? 'link copied' : entry.id}
              </button>
              {/* The bogey tally rides along with the ticket it belongs to, so the
                  host can see it while handing tickets out or looking one up. */}
              {bogeyCount > 0 && (
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">
                  {bogeyCount} bogey{bogeyCount === 1 ? '' : 's'}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
