import { useMemo, useState } from 'react'
import { useGameStore } from './store/gameStore'
import { useClaimStore } from './store/claimStore'
import { useSettingsStore } from './store/settingsStore'
import { NumberDisplay } from './components/NumberDisplay'
import { DrawButton } from './components/DrawButton'
import { UndoButton } from './components/UndoButton'
import { NumberGrid } from './components/NumberGrid'
import { PaceIndicator } from './components/PaceIndicator'
import { DisplayMode } from './components/DisplayMode'
import { HomeScreen } from './components/HomeScreen'
import { RecentNumbers } from './components/RecentNumbers'
import { GameOverCard } from './components/GameOverCard'
import {
  BadgeCheckIcon,
  CastIcon,
  ChevronLeftIcon,
  SettingsIcon,
  TicketIcon,
} from './components/icons'
import { TicketsPanel } from './components/TicketsPanel'
import { VerifierPanel } from './components/VerifierPanel'
import { SettingsSheet } from './components/SettingsSheet'
import { PrintSheet } from './components/PrintSheet'
import { ResumeGamePrompt } from './components/ResumeGamePrompt'
import { useTicketSetStore } from './store/ticketSetStore'
import { themes } from './themes'
import { stageVariables } from './themes/stage'
import * as persist from './store/persist'
import { resumeGame, startNewGame } from './store/gameSession'
import { useDrawWithSound } from './useDrawWithSound'
import { useWakeLock } from './useWakeLock'

// Checked once at module load — it's a URL, it doesn't change mid-session.
const urlParams = new URLSearchParams(window.location.search)

// /?display=1 renders the room display (TV/projector) instead of the host
// controls — same app, same store, same tab; see DisplayMode.tsx. Optional
// &theme=<id> picks the pack, since the stage has no picker chrome.
const showDisplay = urlParams.has('display')
const urlThemeId = urlParams.get('theme')

// Shared look for the small header buttons, in stage tokens so the active
// theme paints them along with everything else. min 44px touch targets.
const HEADER_BUTTON =
  'flex h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-(--stage-panel) px-2.5 text-sm font-semibold text-(--stage-number) transition active:scale-95'

function App() {
  // Keep the host's screen awake while the caller is on screen.
  useWakeLock()

  const currentNumber = useGameStore((s) => s.currentNumber)
  const called = useGameStore((s) => s.called)
  const history = useGameStore((s) => s.history)
  const drawSeq = useGameStore((s) => s.drawSeq)
  const lastDrawnAt = useGameStore((s) => s.lastDrawnAt)
  const undo = useGameStore((s) => s.undo)
  const gameSaveFailed = useGameStore((s) => s.saveFailed)
  const claimSaveFailed = useClaimStore((s) => s.saveFailed)

  // A saved game found on mount, held here until the host explicitly picks
  // Resume or New Game — never auto-resumed. The home screen is that gate on
  // the normal path; ResumeGamePrompt covers ?display=1 loads, which skip
  // home. history.length === 0 (a draw undone right before a refresh) is
  // treated as "nothing to resume".
  const [pendingResume, setPendingResume] = useState<persist.PersistedGame | null>(
    () => {
      const saved = persist.loadGame()
      return saved !== null && saved.history.length > 0 ? saved : null
    },
  )
  // Set only if a resume was attempted and the replay didn't match — shown
  // once the host reaches the caller, since gameSession already fell back to
  // a fresh game by then.
  const [resumeError, setResumeError] = useState<string | null>(null)

  // Which pack is active: the persisted choice, resolved against the registry
  // so a stale id (pack renamed/removed) falls back to the first pack instead
  // of crashing. Switching themes mid-game changes phrases and paint, not the
  // draw order, so it lives in settings — not the game store.
  const savedThemeId = useSettingsStore((s) => s.themeId)
  const setThemeId = useSettingsStore((s) => s.setThemeId)
  const theme = themes.find((t) => t.id === savedThemeId) ?? themes[0]

  // The host's front door vs. the caller itself. Plain state, not a router —
  // two screens in one bundle don't need one.
  const [screen, setScreen] = useState<'home' | 'game'>('home')

  // Which full-screen host panel is open, if any. Panels overlay whichever
  // screen is behind them, so this state lives here, above both.
  const [panel, setPanel] = useState<'tickets' | 'verify' | 'settings' | null>(null)
  // Mounting the print sheet opens the browser's print dialog; unmounting it on
  // 'afterprint' puts the host back where they were.
  const [printing, setPrinting] = useState(false)
  const tickets = useTicketSetStore((s) => s.tickets)
  // Draw, then speak the drawn number's phrase when TTS is enabled.
  const drawWithSound = useDrawWithSound(theme)

  // The active theme's paint, applied to the App root so every host surface
  // (home, caller, board) renders from the same tokens as the room display.
  const variables = useMemo(() => stageVariables(theme), [theme])

  // The stage. Uses the URL's theme (or the first pack) rather than the saved
  // choice — a cast tab is its own page load, addressed entirely by its URL.
  if (showDisplay) {
    if (pendingResume !== null) {
      return (
        <ResumeGamePrompt
          drawCount={pendingResume.history.length}
          savedAt={pendingResume.savedAt}
          onResume={() => {
            resumeGame(pendingResume.seed, pendingResume.history)
            setPendingResume(null)
          }}
          onNewGame={() => {
            startNewGame()
            setPendingResume(null)
          }}
        />
      )
    }
    const displayTheme = themes.find((t) => t.id === urlThemeId) ?? themes[0]
    return <DisplayMode theme={displayTheme} />
  }

  const call = currentNumber !== null ? theme.calls[String(currentNumber)] : null
  const phrase = call?.phrase ?? null
  const canUndo = called.size > 0
  const gameOver = called.size >= 90

  return (
    <>
    <div
      className="flex h-dvh flex-col text-white print:hidden"
      style={{
        ...(variables as React.CSSProperties),
        // Quiet accent glow bleeding in from the top — mixed from the theme's
        // own accent so every pack gets its own ambience for free.
        background:
          'radial-gradient(ellipse 130% 60% at 50% -15%, color-mix(in oklab, var(--board-called), transparent 88%), transparent 65%), var(--stage-bg)',
      }}
    >
      {resumeError !== null && (
        <div className="flex items-center justify-between gap-2 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
          <span>{resumeError}</span>
          <button
            type="button"
            onClick={() => setResumeError(null)}
            className="font-bold"
          >
            ×
          </button>
        </div>
      )}

      {screen === 'home' ? (
        <HomeScreen
          themes={themes}
          theme={theme}
          onChangeTheme={setThemeId}
          pendingResume={pendingResume}
          activeDrawCount={called.size}
          onResume={() => {
            if (pendingResume === null) return
            const result = resumeGame(pendingResume.seed, pendingResume.history)
            if (!result.ok) setResumeError(result.reason)
            setPendingResume(null)
            setScreen('game')
          }}
          onNewGame={() => {
            startNewGame()
            setPendingResume(null)
            setScreen('game')
          }}
          onPlay={() => setScreen('game')}
          onOpenTickets={() => setPanel('tickets')}
          onOpenSettings={() => setPanel('settings')}
        />
      ) : (
        <>
          <header className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="flex items-center gap-2">
              {/* Back to the front door. The game keeps running (and stays
                  persisted) — home offers Continue when draws exist. */}
              <button
                type="button"
                onClick={() => setScreen('home')}
                aria-label="Home"
                className={HEADER_BUTTON}
              >
                <ChevronLeftIcon />
                {/* Label folds away on narrow phones — the row must never clip. */}
                <span className="hidden sm:inline">Home</span>
              </button>
              {(gameSaveFailed || claimSaveFailed) && (
                <span className="text-xs font-semibold text-red-400">
                  Not saving to this device
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  // Re-render this tab as the room display and cast/HDMI it.
                  // State is persisted, so the display's resume gate picks the
                  // game right back up — no channel between tabs, ever.
                  window.location.assign(
                    `/?display=1&theme=${encodeURIComponent(theme.id)}`,
                  )
                }}
                aria-label="Room display"
                className={HEADER_BUTTON}
              >
                <CastIcon />
              </button>
              <button
                type="button"
                onClick={() => setPanel('tickets')}
                aria-label="Tickets"
                className={HEADER_BUTTON}
              >
                <TicketIcon />
              </button>
              <button
                type="button"
                onClick={() => setPanel('verify')}
                aria-label="Check a claim"
                className={HEADER_BUTTON}
              >
                <BadgeCheckIcon />
              </button>
              <button
                type="button"
                onClick={() => setPanel('settings')}
                aria-label="Settings"
                className={HEADER_BUTTON}
              >
                <SettingsIcon />
              </button>
              <UndoButton onUndo={undo} disabled={!canUndo} />
            </div>
          </header>

          {/* min-h-0 lets this flex child actually shrink below its content size
              instead of forcing the page taller than the viewport; overflow-y-auto
              (not hidden) means if it still doesn't fit, it scrolls instead of
              silently clipping the phrase — legibility over layout purity. */}
          <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-4">
            {gameOver ? (
              <GameOverCard onNewGame={startNewGame} />
            ) : (
              <>
                <NumberDisplay
                  currentNumber={currentNumber}
                  phrase={phrase}
                  drawSeq={drawSeq}
                />
                <RecentNumbers history={history} />
              </>
            )}
          </main>

          <section className="mx-auto w-full max-w-lg px-4 pb-2">
            <div className="max-h-[18vh] overflow-y-auto rounded-2xl border border-white/5 bg-(--stage-panel) p-2">
              <NumberGrid called={called} />
            </div>
          </section>

          <footer className="flex flex-col items-center gap-1 px-4 pt-1 pb-4">
            {!gameOver && (
              <>
                <PaceIndicator lastDrawnAt={lastDrawnAt} />
                <DrawButton onDraw={drawWithSound} disabled={gameOver} />
              </>
            )}
          </footer>
        </>
      )}

      {panel === 'tickets' && (
        <TicketsPanel
          onClose={() => setPanel(null)}
          onPrint={() => setPrinting(true)}
        />
      )}
      {panel === 'verify' && (
        <VerifierPanel onClose={() => setPanel(null)} theme={theme} />
      )}
      {panel === 'settings' && (
        <SettingsSheet currentThemeId={theme.id} onClose={() => setPanel(null)} />
      )}
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
