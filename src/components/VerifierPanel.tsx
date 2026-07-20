// The claim verifier. Host only.
//
// Someone shouts "HOUSE!". The host types the ticket ID off their phone screen or
// their paper ticket, and this panel rebuilds that exact ticket from the ID — no
// lookup, no database, no message from the player's device — and compares its 15
// numbers against the numbers actually called. Verdict in well under a second,
// which is the only speed that works in a noisy room.
//
// What it compares matters: CALLED numbers vs the ticket's TRUE numbers. It never
// sees, asks for, or trusts what the player marked. A player who marked sloppily but
// claims correctly is valid; a player who marked a number that was never called is a
// bogey. The app doesn't know or care which cells they coloured in.

import { useState } from 'react'
import { verifyClaim, type Dividend } from '../engine/ticket'
import { parseTicketId, ticketFromRef } from '../engine/ticketId'
import { useGameStore } from '../store/gameStore'
import { useClaimStore } from '../store/claimStore'
import { TicketFace } from './TicketFace'
import type { Theme } from '../themes/types'

// The six standard dividends, in the order a game usually awards them.
const DIVIDENDS: { key: Dividend; label: string }[] = [
  { key: 'earlyFive', label: 'Early Five' },
  { key: 'topLine', label: 'Top Line' },
  { key: 'middleLine', label: 'Middle Line' },
  { key: 'bottomLine', label: 'Bottom Line' },
  { key: 'corners', label: 'Corners' },
  { key: 'fullHouse', label: 'Full House' },
]

interface VerifierPanelProps {
  onClose: () => void
  theme: Theme
}

export function VerifierPanel({ onClose, theme }: VerifierPanelProps) {
  const history = useGameStore((s) => s.history)
  const called = useGameStore((s) => s.called)
  const bogeys = useClaimStore((s) => s.bogeys)
  const record = useClaimStore((s) => s.record)

  const [input, setInput] = useState('')
  // The dividend just ruled on, so the host gets a visible confirmation the tap landed.
  const [lastRuled, setLastRuled] = useState<Dividend | null>(null)
  // The dividend's milestone phrase, shown only after a VALID ruling — reuses the
  // stage's phrase-text treatment rather than a new component or animation.
  const [milestonePhrase, setMilestonePhrase] = useState<string | null>(null)

  // Parsed live as the host types — the verdict appears the moment the ID is complete,
  // with no "Check" button to press.
  const ref = parseTicketId(input)
  const ticket = ref === null ? null : ticketFromRef(ref)
  const ticketId = ref === null ? null : input.trim().toUpperCase()

  function rule(dividend: Dividend, valid: boolean) {
    if (ticketId === null) return
    record({ ticketId, dividend, valid, atCall: history.length })
    setLastRuled(dividend)
    setMilestonePhrase(valid ? theme.milestones[dividend].phrase : null)
  }

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-(--stage-bg) text-white">
      <header className="sticky top-0 flex items-center justify-between gap-3 border-b border-white/5 bg-(--stage-bg)/95 px-4 py-3 backdrop-blur">
        <h2 className="font-display text-xl font-bold text-(--stage-number)">
          Check a claim
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-xl bg-(--stage-panel) px-4 py-2 text-sm font-semibold transition active:scale-95"
        >
          Close
        </button>
      </header>

      <div className="px-4 py-3">
        <input
          autoFocus
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setLastRuled(null)
            setMilestonePhrase(null)
          }}
          placeholder="Ticket ID, e.g. K3P9Z-04"
          className="w-full rounded-xl border border-white/5 bg-(--stage-panel) px-4 py-3 font-mono text-lg tracking-widest text-(--stage-number) uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-(--stage-chrome)"
        />
        <p className="mt-1 text-xs text-(--stage-chrome)">
          {history.length} number{history.length === 1 ? '' : 's'} called so far.
        </p>
      </div>

      {input.trim().length > 0 && ticket === null && (
        <p className="px-4 text-sm text-amber-400">
          Not a ticket ID yet — it looks like <span className="font-mono">K3P9Z-04</span>.
        </p>
      )}

      {ticket !== null && ticketId !== null && (
        <div className="px-4 pb-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono tracking-widest text-(--stage-chrome)">
              {ticketId}
            </span>
            {(bogeys[ticketId] ?? 0) > 0 && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">
                {bogeys[ticketId]} previous bogey
                {bogeys[ticketId] === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {milestonePhrase !== null && (
            <p className="mb-3 text-center text-lg font-semibold text-(--stage-phrase) sm:text-xl">
              {milestonePhrase}
            </p>
          )}

          {/* The ticket itself, with the numbers that have genuinely been called
              lit up. This is the host's cross-reference, on the host's screen —
              exactly what a host does today with a printed sheet and a pen. */}
          <div className="rounded-2xl border border-white/5 bg-(--stage-panel) p-2">
            <TicketFace ticket={ticket} calledNumbers={called} />
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {DIVIDENDS.map(({ key, label }) => {
              const result = verifyClaim(ticket, history, key)
              // Early Five needs any 5 of 15; the rest need their whole region.
              const need = key === 'earlyFive' ? 5 : result.marked.length + result.missing.length
              const have = key === 'earlyFive' ? Math.min(result.marked.length, 5) : result.marked.length

              return (
                <li
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-(--stage-panel) px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-(--stage-number)">{label}</div>
                    <div className="text-xs tabular-nums text-(--stage-chrome)">
                      {have} of {need} called
                      {result.missing.length > 0 && !result.valid && (
                        <> · missing {result.missing.join(', ')}</>
                      )}
                    </div>
                  </div>

                  {/* One tap records the ruling. The verdict is already decided —
                      the button just logs which dividend was actually claimed, so
                      the bogey tally reflects real shouts, not idle browsing. */}
                  <button
                    type="button"
                    onClick={() => rule(key, result.valid)}
                    className={`shrink-0 cursor-pointer rounded-lg px-4 py-2 text-sm font-bold transition active:scale-95 ${
                      result.valid
                        ? 'bg-emerald-500 text-neutral-950'
                        : 'bg-red-500/90 text-white'
                    }`}
                  >
                    {result.valid ? 'VALID' : 'BOGEY'}
                    {lastRuled === key && ' ✓'}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
