import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import { NumberDisplay } from './components/NumberDisplay'
import { DrawButton } from './components/DrawButton'
import { UndoButton } from './components/UndoButton'
import { NumberGrid } from './components/NumberGrid'
import { PaceIndicator } from './components/PaceIndicator'
import { ThemePicker } from './components/ThemePicker'
import { DisplayMode } from './components/DisplayMode'
import { TicketsPanel } from './components/TicketsPanel'
import { VerifierPanel } from './components/VerifierPanel'
import { PrintSheet } from './components/PrintSheet'
import { useTicketSetStore } from './store/ticketSetStore'
import { themes } from './themes'

// Checked once at module load — it's a URL, it doesn't change mid-session.
const urlParams = new URLSearchParams(window.location.search)

// /?display=1 renders the room display (TV/projector) instead of the host
// controls — same app, same store, same tab; see DisplayMode.tsx. Optional
// &theme=<id> picks the pack, since the stage has no picker chrome.
const showDisplay = urlParams.has('display')
const urlThemeId = urlParams.get('theme')

function App() {
  const currentNumber = useGameStore((s) => s.currentNumber)
  const called = useGameStore((s) => s.called)
  const lastDrawnAt = useGameStore((s) => s.lastDrawnAt)
  const draw = useGameStore((s) => s.draw)
  const undo = useGameStore((s) => s.undo)

  // Which pack is active. UI state only — switching themes mid-game changes
  // the phrases, not the draw order, so it's deliberately not in the game store.
  const [themeId, setThemeId] = useState(themes[0].id)

  // Which full-screen host panel is open, if any. Both cover the game screen
  // rather than sitting beside it — the host is doing one thing at a time.
  const [panel, setPanel] = useState<'tickets' | 'verify' | null>(null)
  // Mounting the print sheet opens the browser's print dialog; unmounting it on
  // 'afterprint' puts the host back where they were.
  const [printing, setPrinting] = useState(false)
  const tickets = useTicketSetStore((s) => s.tickets)
  // The registry validated every pack at load, so this lookup can't miss as
  // long as themeId came from the picker.
  const theme = themes.find((t) => t.id === themeId) ?? themes[0]

  // The stage. Uses the URL's theme (or the first pack) rather than the picker
  // state — a cast tab is its own page load, there is no picker on screen.
  if (showDisplay) {
    const displayTheme = themes.find((t) => t.id === urlThemeId) ?? themes[0]
    return <DisplayMode theme={displayTheme} />
  }

  const call = currentNumber !== null ? theme.calls[String(currentNumber)] : null
  const phrase = call?.phrase ?? null
  const canUndo = called.size > 0
  const gameOver = called.size >= 90

  return (
    <>
    <div className="flex h-dvh flex-col bg-neutral-950 text-white print:hidden">
      <header className="flex items-center justify-between gap-2 px-3 py-1">
        <ThemePicker themes={themes} currentId={themeId} onChange={setThemeId} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPanel('tickets')}
            className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-semibold"
          >
            Tickets
          </button>
          <button
            type="button"
            onClick={() => setPanel('verify')}
            className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-semibold"
          >
            Check
          </button>
          <UndoButton onUndo={undo} disabled={!canUndo} />
        </div>
      </header>

      {/* min-h-0 lets this flex child actually shrink below its content size
          instead of forcing the page taller than the viewport; overflow-y-auto
          (not hidden) means if it still doesn't fit, it scrolls instead of
          silently clipping the phrase — legibility over layout purity. */}
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto">
        <NumberDisplay currentNumber={currentNumber} phrase={phrase} />
      </main>

      <section className="max-h-[18vh] overflow-y-auto px-2 pb-2">
        <NumberGrid called={called} />
      </section>

      <footer className="flex flex-col items-center gap-1 px-4 pt-1 pb-4">
        <PaceIndicator lastDrawnAt={lastDrawnAt} />
        <DrawButton onDraw={draw} disabled={gameOver} />
      </footer>

      {panel === 'tickets' && (
        <TicketsPanel
          onClose={() => setPanel(null)}
          onPrint={() => setPrinting(true)}
        />
      )}
      {panel === 'verify' && <VerifierPanel onClose={() => setPanel(null)} />}
    </div>

    {/* Outside the print:hidden wrapper on purpose — on paper, the print sheet is
        the ONLY thing that should exist. */}
    {printing && (
      <PrintSheet tickets={tickets} onDone={() => setPrinting(false)} />
    )}
    </>
  )
}

export default App
