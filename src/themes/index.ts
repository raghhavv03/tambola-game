// Theme registry. import.meta.glob picks up every JSON file in themes/ at
// build time, so adding a new pack = dropping a file in that folder. No
// component, no registry edit, no import statement — if a new theme ever
// needs one, the abstraction is broken (THEME_PACK_GUIDE.md §7).
//
// Every pack is validated eagerly at module load: a broken pack crashes the
// app at startup with a full problem list, not mid-game with a blank phrase.

import type { Theme } from './types'
import { validateTheme } from './loader'

const packFiles = import.meta.glob<{ default: unknown }>(
  '../../themes/*.json',
  { eager: true },
)

export const themes: Theme[] = Object.entries(packFiles)
  .map(([path, module]) => validateTheme(module.default, path))
  // Stable alphabetical order by display name so the picker doesn't reshuffle
  // depending on filesystem enumeration order.
  .sort((a, b) => a.name.localeCompare(b.name))

if (themes.length === 0) {
  throw new Error('No theme packs found in themes/ — the app cannot run without one')
}
