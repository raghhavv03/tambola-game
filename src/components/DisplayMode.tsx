// The room display — `/?display=1`. Same app, same store, same tab; the host
// casts/AirPlays this tab or plugs in HDMI. It is the STAGE: the whole room reads
// it, so every choice below starts from the legibility floor (a 79-year-old, 4
// metres, lit room) and only then reaches for polish.
//
// THEMING IS DATA. Every color on this screen comes from the theme's `display`
// token block (see ThemeDisplay in src/themes/types.ts), exposed here as CSS
// variables. This component knows token NAMES, never theme names — there is no
// `if (theme.id === ...)` and there must never be one. A new theme's entire look
// is authored in its JSON; the loader has already refused any palette whose
// information-carrying pairs miss the contrast floors, so by the time tokens
// reach this file they are guaranteed legible.
//
// The one structural rule the renderer itself enforces: the number sits on a
// flat field of `background`. The optional `backdrop` wash only darkens the
// stage's EDGES (the radial keeps the center 55% pure background), and the
// optional `halo` renders outside the glyph strokes — nothing a theme can
// declare puts decoration behind the number.
//
// V1 has no remote channel by design. Same tab means the host still needs a way
// to draw from here: tap/click anywhere, or Space/Enter. Undo stays keyboard-only
// (U / Backspace) so a stray second tap can never un-call a number in front of
// the room.

import { useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { useGameStore } from '../store/gameStore'
import { useDrawWithSound } from '../useDrawWithSound'
import { useWakeLock } from '../useWakeLock'
import { useReducedMotionSetting } from '../useReducedMotionSetting'
import type { Theme, ThemeDisplay } from '../themes/types'

/** App-default accent (amber-400) for packs that don't declare one. */
const DEFAULT_ACCENT = '#fbbf24'

const ALL_NUMBERS = Array.from({ length: 90 }, (_, i) => i + 1)

// The app's own stage — used token-by-token wherever a pack doesn't specify.
// These are app constants, not theme data, so they may use any CSS color form;
// the loader's contrast floors govern THEME data, and these defaults were
// chosen to clear the same floors.
const DEFAULT_STAGE = {
  background: '#0a0a0a', // neutral-950
  number: '#ffffff', // ~19:1 on the default background
  panel: 'rgba(255, 255, 255, 0.08)',
  boardCalledText: '#0a0a0a',
  boardUncalled: 'rgba(255, 255, 255, 0.05)',
  boardUncalledText: 'rgba(255, 255, 255, 0.45)',
  ring: '#ffffff',
  chrome: 'rgba(255, 255, 255, 0.5)',
} as const

/** Resolve a theme into the full CSS-variable set the stage renders from. */
function stageVariables(theme: Theme): Record<string, string> {
  const d: Partial<ThemeDisplay> = theme.display ?? {}
  const accent = theme.accent ?? DEFAULT_ACCENT
  const background = d.background ?? DEFAULT_STAGE.background
  return {
    '--stage-bg': background,
    // No backdrop declared -> same color as the field, i.e. a flat stage.
    '--stage-backdrop': d.backdrop ?? background,
    '--stage-number': d.number ?? DEFAULT_STAGE.number,
    // 'transparent' disables the halo's text-shadow without a conditional in JSX.
    '--stage-halo': d.halo ?? 'transparent',
    '--stage-phrase': d.phrase ?? accent,
    '--stage-panel': d.panel ?? DEFAULT_STAGE.panel,
    '--board-called': d.boardCalled ?? accent,
    '--board-called-text': d.boardCalledText ?? DEFAULT_STAGE.boardCalledText,
    '--board-uncalled': d.boardUncalled ?? DEFAULT_STAGE.boardUncalled,
    '--board-uncalled-text':
      d.boardUncalledText ?? DEFAULT_STAGE.boardUncalledText,
    '--stage-ring': d.ring ?? DEFAULT_STAGE.ring,
    '--stage-chrome': d.chrome ?? DEFAULT_STAGE.chrome,
  }
}

interface DisplayModeProps {
  theme: Theme
}

// --- the called-numbers board, board-of-the-room edition ----------------------
//
// Same 9 rows x 10 cols as the host's grid, colored entirely by board tokens.
// Called cells pop, uncalled cells stay quiet — the PATTERN is the message from
// 4 metres, and dimming uncalled is what makes the pattern readable. The loader
// guarantees both cell pairings clear their floors.
function Board({ called, current }: { called: Set<number>; current: number | null }) {
  return (
    <div className="grid w-full grid-cols-10 gap-[0.4vh]">
      {ALL_NUMBERS.map((n) => {
        const isCalled = called.has(n)
        const isCurrent = n === current
        return (
          <div
            key={n}
            className={
              'flex aspect-square items-center justify-center rounded-[0.5vh] font-bold tabular-nums ' +
              (isCalled
                ? 'bg-(--board-called) text-(--board-called-text)'
                : 'bg-(--board-uncalled) text-(--board-uncalled-text)')
            }
            // The freshest call gets a ring so eyes can find it on the board —
            // a static ring, not a pulse: it must still be there when someone
            // looks up thirty seconds later.
            style={{
              fontSize: 'clamp(0.65rem, 2vh, 1.4rem)',
              boxShadow: isCurrent ? '0 0 0 0.3vh var(--stage-ring)' : undefined,
            }}
          >
            {n}
          </div>
        )
      })}
    </div>
  )
}

// --- the last three calls, for latecomers -------------------------------------
//
// Fixed three slots (placeholders before there's history) so the column never
// changes size — the stage must not reflow mid-game.
function RecentCalls({ history }: { history: number[] }) {
  // Everything before the current number, newest first, top three.
  const recent = history.slice(0, -1).slice(-3).reverse()

  return (
    <div>
      <p
        className="mb-[1vh] font-semibold tracking-[0.2em] text-(--stage-chrome) uppercase"
        style={{ fontSize: 'clamp(0.7rem, 1.6vh, 1rem)' }}
      >
        Earlier
      </p>
      <div className="flex gap-[1.2vh]">
        {[0, 1, 2].map((slot) => {
          const n = recent[slot]
          return (
            <div
              key={slot}
              className="flex aspect-square flex-1 items-center justify-center rounded-[1vh] bg-(--stage-panel) font-bold text-(--stage-number) tabular-nums"
              // Newest of the three reads strongest; the fade encodes order
              // without needing labels anyone would have to squint at. Empty
              // slots keep the tile but drop the numeral to a faint dot.
              style={{
                fontSize: 'clamp(1.5rem, 5vh, 4rem)',
                opacity: n !== undefined ? 1 - slot * 0.25 : 0.35,
              }}
            >
              {n ?? '·'}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function DisplayMode({ theme }: DisplayModeProps) {
  // Keep the projector/cast device awake for the whole game.
  useWakeLock()

  const currentNumber = useGameStore((s) => s.currentNumber)
  const history = useGameStore((s) => s.history)
  const called = useGameStore((s) => s.called)
  const drawSeq = useGameStore((s) => s.drawSeq)
  const undo = useGameStore((s) => s.undo)
  // Draw, then speak the drawn phrase when TTS is on.
  const drawWithSound = useDrawWithSound(theme)

  const reducedMotion = useReducedMotionSetting()

  const call = currentNumber !== null ? theme.calls[String(currentNumber)] : null
  const gameOver = called.size >= 90

  const variables = useMemo(() => stageVariables(theme), [theme])

  // Draw/undo from the display itself — the host is holding the device this tab
  // runs on. Undo is deliberately NOT on tap; see the header comment.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault() // Space must not scroll the stage
        drawWithSound()
      } else if (event.key === 'Backspace' || event.key.toLowerCase() === 'u') {
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawWithSound, undo])

  // The entrance choreography for a draw: the number lands first with a firm
  // spring (no bounce past its final size — overshoot at this scale looks
  // cartoonish, not premium), the phrase follows a beat later. Both replay per
  // draw because the subtree is keyed on drawSeq.
  const numberEntrance = useMemo(
    () =>
      reducedMotion
        ? {}
        : {
            initial: { opacity: 0, scale: 0.92 },
            animate: { opacity: 1, scale: 1 },
            // Physics-only spring: this stiffness/damping settles in
            // ~350-400ms with no overshoot past final size.
            transition: {
              type: 'spring' as const,
              stiffness: 320,
              damping: 30,
            },
          },
    [reducedMotion],
  )
  const phraseEntrance = useMemo(
    () =>
      reducedMotion
        ? {}
        : {
            initial: { opacity: 0, y: '1.2vh' },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.14, duration: 0.35, ease: 'easeOut' as const },
          },
    [reducedMotion],
  )

  return (
    <div
      className="flex h-dvh cursor-pointer flex-col overflow-hidden select-none"
      style={{
        ...(variables as React.CSSProperties),
        // The stage's one background treatment: a flat field that recedes into
        // `backdrop` at the EDGES. The center 55% is pure `background` — that
        // is the field the number sits on, and the loader validated the
        // number-on-background pair at the strictest floor. With no backdrop
        // token both stops are the same color and the stage is simply flat.
        background:
          'radial-gradient(ellipse 120% 95% at 50% 42%, var(--stage-bg) 55%, var(--stage-backdrop) 100%)',
      }}
      onClick={() => {
        if (!gameOver) drawWithSound()
      }}
    >
      {/* Quiet chrome: who's calling and how far in. Small on purpose — it's
          reference information, not the show. */}
      <header
        className="flex items-baseline justify-between px-[3vw] pt-[2vh] text-(--stage-chrome)"
        style={{ fontSize: 'clamp(0.9rem, 2.2vh, 1.6rem)' }}
      >
        <span className="font-semibold tracking-[0.15em] uppercase">
          {theme.name}
        </span>
        <span className="font-semibold tabular-nums">
          {called.size}
          <span className="opacity-60"> / 90</span>
        </span>
      </header>

      <div className="flex min-h-0 flex-1 items-stretch gap-[3vw] px-[3vw] pb-[2vh]">
        {/* THE STAGE. The number owns the largest block of space on screen and
            nothing is ever drawn behind it. */}
        <main className="flex min-w-0 flex-1 flex-col items-center justify-center">
          <motion.div
            key={drawSeq}
            {...numberEntrance}
            className="font-black leading-none text-(--stage-number) tabular-nums"
            // vh-led sizing: the number's ceiling is the screen's height, with a
            // vw guard so a narrow projector can't clip "90". Tight tracking
            // makes two digits read as one mark. The halo (if the theme has
            // one) is a text-shadow: it glows AROUND the strokes and cannot
            // sit between the glyph and its field.
            style={{
              fontSize: 'min(52vh, 36vw)',
              letterSpacing: '-0.04em',
              textShadow:
                '0 0 4vh var(--stage-halo), 0 0 12vh var(--stage-halo)',
            }}
          >
            {currentNumber ?? '—'}
          </motion.div>

          {/* Reserved two-line block: a one-line phrase and a two-line phrase
              put the number at the same height, so the stage never jumps. */}
          <motion.p
            key={`phrase-${drawSeq}`}
            {...phraseEntrance}
            className="mt-[2vh] line-clamp-2 max-w-[52vw] text-center leading-snug font-semibold text-(--stage-phrase)"
            style={{
              fontSize: 'clamp(1.3rem, 4.2vh, 3.2rem)',
              minHeight: 'calc(2.6em)',
            }}
          >
            {gameOver
              ? 'All ninety numbers called.'
              : (call?.phrase ?? 'Waiting for the first number…')}
          </motion.p>
        </main>

        {/* The room's reference panel: recent calls above, full board below.
            Fixed proportion of the screen so the stage's share never varies. */}
        <aside className="flex w-[30vw] max-w-[560px] flex-col justify-center gap-[3vh]">
          <RecentCalls history={history} />
          <Board called={called} current={currentNumber} />
        </aside>
      </div>

      {/* One line of operator help, dim enough that the room ignores it. */}
      <footer
        className="px-[3vw] pb-[1.5vh] text-(--stage-chrome) opacity-60"
        style={{ fontSize: 'clamp(0.7rem, 1.6vh, 1rem)' }}
      >
        {gameOver ? 'Game over' : 'Tap or press Space to draw · U to undo'}
      </footer>
    </div>
  )
}
