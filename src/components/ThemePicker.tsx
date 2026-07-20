// Theme selector. Renders whatever packs the registry loaded — it never names
// or special-cases a specific theme, so new packs appear here automatically.
//
// Each pack is previewed as a card painted in its OWN colors (via themeSwatch,
// which applies the same defaults as the stage), so choosing a theme is choosing
// a look you can already see — not a name in a dropdown.

import type { Theme } from '../themes/types'
import { themeSwatch } from '../themes/stage'

interface ThemePickerProps {
  themes: Theme[]
  currentId: string
  onChange: (id: string) => void
}

export function ThemePicker({ themes, currentId, onChange }: ThemePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Theme">
      {themes.map((theme) => {
        const swatch = themeSwatch(theme)
        const active = theme.id === currentId
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(theme.id)}
            className="cursor-pointer rounded-2xl border-2 p-4 text-left transition active:scale-95"
            style={{
              background: swatch.background,
              // The pack's own accent marks the selected card; unselected cards
              // sit on a quiet neutral hairline.
              borderColor: active ? swatch.accent : 'rgba(255, 255, 255, 0.12)',
            }}
          >
            {/* Three dots preview the pack's palette: accent, text, muted. */}
            <span className="mb-3 flex gap-1.5">
              {[swatch.accent, swatch.text, swatch.muted].map((color, i) => (
                <span
                  key={i}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: color }}
                />
              ))}
            </span>
            <span
              className="font-display block text-lg font-bold"
              style={{ color: swatch.text }}
            >
              {theme.name}
            </span>
            <span
              className="mt-0.5 line-clamp-2 block text-xs leading-snug"
              style={{ color: swatch.muted }}
            >
              {theme.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}
