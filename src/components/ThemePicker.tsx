// Theme selector. Renders whatever packs the registry loaded — it never names
// or special-cases a specific theme, so new packs appear here automatically.

import type { Theme } from '../themes/types'

interface ThemePickerProps {
  themes: Theme[]
  currentId: string
  onChange: (id: string) => void
}

export function ThemePicker({ themes, currentId, onChange }: ThemePickerProps) {
  return (
    <select
      value={currentId}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-white/20 bg-neutral-900 px-2 py-1 text-xs text-white/70"
      aria-label="Theme"
    >
      {themes.map((theme) => (
        // title shows the one-line description on hover/long-press
        <option key={theme.id} value={theme.id} title={theme.description}>
          {theme.name}
        </option>
      ))}
    </select>
  )
}
