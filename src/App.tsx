import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import { NumberDisplay } from './components/NumberDisplay'
import { DrawButton } from './components/DrawButton'
import { UndoButton } from './components/UndoButton'
import { NumberGrid } from './components/NumberGrid'
import { PaceIndicator } from './components/PaceIndicator'
import { ThemePicker } from './components/ThemePicker'
import { themes } from './themes'

function App() {
  const currentNumber = useGameStore((s) => s.currentNumber)
  const called = useGameStore((s) => s.called)
  const lastDrawnAt = useGameStore((s) => s.lastDrawnAt)
  const draw = useGameStore((s) => s.draw)
  const undo = useGameStore((s) => s.undo)

  // Which pack is active. UI state only — switching themes mid-game changes
  // the phrases, not the draw order, so it's deliberately not in the game store.
  const [themeId, setThemeId] = useState(themes[0].id)
  // The registry validated every pack at load, so this lookup can't miss as
  // long as themeId came from the picker.
  const theme = themes.find((t) => t.id === themeId) ?? themes[0]

  const phrase =
    currentNumber !== null ? theme.calls[String(currentNumber)].phrase : null
  const canUndo = called.size > 0
  const gameOver = called.size >= 90

  return (
    <div className="flex h-dvh flex-col bg-neutral-950 text-white">
      <header className="flex items-center justify-between gap-2 px-3 py-1">
        <ThemePicker themes={themes} currentId={themeId} onChange={setThemeId} />
        <UndoButton onUndo={undo} disabled={!canUndo} />
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
    </div>
  )
}

export default App
