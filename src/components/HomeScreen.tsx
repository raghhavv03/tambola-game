// The front door — shown before the caller so a first-time host lands on a
// screen that explains itself: pick a theme, start (or resume) a game, and
// find Tickets / Room display / Settings without hunting.
//
// Colors come from the stage tokens set on the App root, so picking a theme
// here repaints the screen immediately — live feedback for the choice.

import type { Theme } from '../themes/types'
import type { PersistedGame } from '../store/persist'
import { ThemePicker } from './ThemePicker'
import { formatRelativeTime } from '../relativeTime'
import { CastIcon, PlayIcon, SettingsIcon, TicketIcon } from './icons'

interface HomeScreenProps {
  themes: Theme[]
  theme: Theme
  onChangeTheme: (id: string) => void
  /** A saved game found on disk, not yet resumed — null once decided. */
  pendingResume: PersistedGame | null
  /** Draws already made in THIS session (host came back to home mid-game). */
  activeDrawCount: number
  onResume: () => void
  onNewGame: () => void
  /** Enter the caller without touching game state. */
  onPlay: () => void
  onOpenTickets: () => void
  onOpenSettings: () => void
}

/** The accent CTA — btn-accent is the app-wide primary-action look. */
const PRIMARY_BUTTON =
  'btn-accent flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-4 text-lg font-bold text-(--board-called-text) transition active:scale-95'

/** Quieter panel-toned action. */
const SECONDARY_BUTTON =
  'w-full cursor-pointer rounded-2xl border border-white/5 bg-(--stage-panel) px-4 py-3 text-base font-semibold text-(--stage-number) transition active:scale-95'

export function HomeScreen({
  themes,
  theme,
  onChangeTheme,
  pendingResume,
  activeDrawCount,
  onResume,
  onNewGame,
  onPlay,
  onOpenTickets,
  onOpenSettings,
}: HomeScreenProps) {
  // Exactly one of three states decides the primary action: a saved game on
  // disk (resume it), a game already running in this session (go back to it),
  // or nothing (start fresh).
  const hasSaved = pendingResume !== null
  const hasActive = activeDrawCount > 0

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center gap-8 overflow-y-auto px-6 py-8">
      <header className="text-center">
        <h1 className="font-display text-5xl font-black text-(--stage-number)">
          Tambola
        </h1>
        {/* Doubles as the first-run explainer: this app never marks tickets. */}
        <p className="mt-2 text-sm text-(--stage-chrome)">
          You call the numbers. Players mark their own tickets.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-[0.65rem] font-semibold tracking-[0.25em] text-(--stage-chrome) uppercase">
          Theme
        </h2>
        <ThemePicker themes={themes} currentId={theme.id} onChange={onChangeTheme} />
      </section>

      <section className="flex flex-col gap-3">
        {hasSaved ? (
          <>
            <button
              type="button"
              onClick={onResume}
              className={PRIMARY_BUTTON}
            >
              <span className="flex flex-col items-center">
                Resume game
                <span className="text-xs font-semibold opacity-70">
                  {pendingResume.history.length} number
                  {pendingResume.history.length === 1 ? '' : 's'} called, saved{' '}
                  {formatRelativeTime(pendingResume.savedAt)}
                </span>
              </span>
            </button>
            <button type="button" onClick={onNewGame} className={SECONDARY_BUTTON}>
              Start new game
            </button>
          </>
        ) : hasActive ? (
          <>
            <button
              type="button"
              onClick={onPlay}
              className={PRIMARY_BUTTON}
            >
              <span className="flex flex-col items-center">
                Continue game
                <span className="text-xs font-semibold opacity-70">
                  {activeDrawCount} number{activeDrawCount === 1 ? '' : 's'} called
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                // Destructive from home too — same guard as everywhere else.
                if (
                  window.confirm(
                    'Start a new game? This clears all draws and bogey tallies.',
                  )
                ) {
                  onNewGame()
                }
              }}
              className={SECONDARY_BUTTON}
            >
              New game
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onPlay}
            className={PRIMARY_BUTTON}
          >
            <PlayIcon />
            Start game
          </button>
        )}
      </section>

      {/* Three equal doorways. Icons carry the glance, labels carry the meaning. */}
      <nav className="grid grid-cols-3 gap-3">
        {(
          [
            { label: 'Tickets', icon: TicketIcon, onClick: onOpenTickets },
            {
              label: 'Display',
              icon: CastIcon,
              onClick: () => {
                // The room display is this same tab, re-rendered as the stage
                // (cast/HDMI it from here). Game state is already persisted, so
                // the display's own resume gate picks it right back up.
                window.location.assign(
                  `/?display=1&theme=${encodeURIComponent(theme.id)}`,
                )
              },
            },
            { label: 'Settings', icon: SettingsIcon, onClick: onOpenSettings },
          ] as const
        ).map(({ label, icon: TileIcon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-white/5 bg-(--stage-panel) px-2 py-4 text-sm font-semibold text-(--stage-number) transition active:scale-95"
          >
            <TileIcon className="h-6 w-6 text-(--stage-phrase)" />
            {label}
          </button>
        ))}
      </nav>
    </main>
  )
}
