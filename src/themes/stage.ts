// Resolves a theme pack into the CSS-variable set every themed host surface
// renders from — the room display AND the host screen use these same tokens,
// so one `display` block in a pack paints both. Extracted from DisplayMode
// when the host screen became themed (RUNBOOK Task 11).
//
// This module knows token NAMES, never theme names — no `if (theme.id === ...)`
// here or in any consumer. A pack that omits tokens gets the app's neutral
// look, token by token.

import type { Theme, ThemeDisplay } from './types'

/** App-default accent (amber-400) for packs that don't declare one. */
export const DEFAULT_ACCENT = '#fbbf24'

// The app's own stage — used token-by-token wherever a pack doesn't specify.
// These are app constants, not theme data, so they may use any CSS color form;
// the loader's contrast floors govern THEME data, and these defaults were
// chosen to clear the same floors.
export const DEFAULT_STAGE = {
  background: '#0a0a0a', // neutral-950
  number: '#ffffff', // ~19:1 on the default background
  panel: 'rgba(255, 255, 255, 0.08)',
  boardCalledText: '#0a0a0a',
  boardUncalled: 'rgba(255, 255, 255, 0.05)',
  boardUncalledText: 'rgba(255, 255, 255, 0.45)',
  ring: '#ffffff',
  chrome: 'rgba(255, 255, 255, 0.5)',
} as const

/** The handful of colors the theme picker needs to preview a pack — resolved
 *  with the same defaults as the stage, so the preview IS the look. */
export interface ThemeSwatch {
  background: string
  text: string
  muted: string
  accent: string
}

export function themeSwatch(theme: Theme): ThemeSwatch {
  const d: Partial<ThemeDisplay> = theme.display ?? {}
  return {
    background: d.background ?? DEFAULT_STAGE.background,
    text: d.number ?? DEFAULT_STAGE.number,
    muted: d.chrome ?? DEFAULT_STAGE.chrome,
    accent: theme.accent ?? DEFAULT_ACCENT,
  }
}

/** Resolve a theme into the full CSS-variable set the stage renders from. */
export function stageVariables(theme: Theme): Record<string, string> {
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
