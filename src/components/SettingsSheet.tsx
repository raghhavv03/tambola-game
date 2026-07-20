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
    <label className="flex items-center justify-between gap-4 py-3">
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className="text-xs text-white/50">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 accent-amber-400"
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
    <div className="fixed inset-0 z-20 flex flex-col bg-neutral-950 text-white">
      <header className="flex items-center justify-between px-4 py-3">
        <h2 className="font-display text-xl font-bold">Settings</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-semibold"
        >
          Done
        </button>
      </header>

      <div className="flex flex-col gap-2 px-4">
        <div className="py-3">
          <div className="mb-2 text-sm font-semibold text-white">Theme</div>
          <ThemePicker
            themes={themes}
            currentId={currentThemeId}
            onChange={setThemeId}
          />
        </div>

        <div className="h-px bg-white/10" />

        <Toggle
          label="Speak numbers"
          hint="Say each number's phrase aloud when you draw it."
          checked={ttsEnabled}
          onChange={setTtsEnabled}
        />

        <div className="h-px bg-white/10" />

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
