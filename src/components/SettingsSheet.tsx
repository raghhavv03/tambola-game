// The host's settings: theme, spoken numbers (TTS), reduce motion. A full-screen
// panel like Tickets / Check — the host does one thing at a time. Host-only.
//
// Reads/writes settingsStore directly (theme included) — the sheet is the
// settings UI, so it owns its wiring rather than threading props through App.

import { themes } from '../themes'
import { ThemePicker } from './ThemePicker'
import { useSettingsStore } from '../store/settingsStore'

interface SettingsSheetProps {
  /** The resolved active theme id (settingsStore's raw id may be stale). */
  currentThemeId: string
  onClose: () => void
}

// A plain labelled on/off switch — no new dependency, just a styled checkbox.
function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-(--stage-number)">{label}</span>
        <span className="text-xs text-(--stage-chrome)">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 shrink-0 accent-(--board-called)"
      />
    </label>
  )
}

export function SettingsSheet({ currentThemeId, onClose }: SettingsSheetProps) {
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const setTtsEnabled = useSettingsStore((s) => s.setTtsEnabled)
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion)
  const setThemeId = useSettingsStore((s) => s.setThemeId)

  return (
    <div className="fixed inset-0 z-20 flex flex-col overflow-y-auto bg-(--stage-bg) text-white">
      <header className="sticky top-0 flex items-center justify-between border-b border-white/5 bg-(--stage-bg)/95 px-4 py-3 backdrop-blur">
        <h2 className="font-display text-xl font-bold text-(--stage-number)">
          Settings
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-xl bg-(--stage-panel) px-4 py-2 text-sm font-semibold transition active:scale-95"
        >
          Done
        </button>
      </header>

      <div className="flex flex-col gap-1 px-4 py-4">
        <div className="pb-4">
          <div className="mb-3 text-[0.65rem] font-semibold tracking-[0.25em] text-(--stage-chrome) uppercase">
            Theme
          </div>
          <ThemePicker themes={themes} currentId={currentThemeId} onChange={setThemeId} />
        </div>

        <div className="h-px bg-white/5" />

        <Toggle
          label="Speak numbers"
          hint="Say each number's phrase aloud when you draw it."
          checked={ttsEnabled}
          onChange={setTtsEnabled}
        />

        <div className="h-px bg-white/5" />

        <Toggle
          label="Reduce motion"
          hint="Skip animations on the room display."
          checked={reducedMotion}
          onChange={setReducedMotion}
        />
      </div>
    </div>
  )
}
