// Theme pack types — mirrors THEME_PACK_GUIDE.md §7 exactly. Themes are DATA:
// the renderer reads these shapes and must never special-case any one pack.

export interface ThemeCall {
  /** Spoken verbatim by the host. */
  phrase: string
  /** Big display glyph for this number. */
  sub: string
  /** Optional recorded audio; TTS fallback if absent. */
  audio?: string
  /** BUILD-TIME ONLY (authoring discipline: REF | SHAPE | SOUND | COMP).
   *  The app must never read this — it exists for pack editors. */
  mech?: string
  /** BUILD-TIME ONLY (editor's judgement note). The app must never read this. */
  note?: string
}

export interface ThemeMilestone {
  phrase: string
}

// The six standard dividends every pack must cover. A const array (not just a
// type) so the validator can loop over it at runtime.
export const MILESTONE_KEYS = [
  'earlyFive',
  'topLine',
  'middleLine',
  'bottomLine',
  'corners',
  'fullHouse',
] as const

export type MilestoneKey = (typeof MILESTONE_KEYS)[number]

/**
 * The room display's visual identity — pure design tokens, all "#rrggbb".
 *
 * The display renderer reads these generically (CSS variables); it contains no
 * per-theme branches, so a new look is authored entirely in JSON. The loader
 * validates every color's FORMAT and, for the pairs that carry information,
 * their CONTRAST — a background that would make the number unreadable from the
 * back of the room fails at load, never silently (see CONTRAST_FLOORS in
 * loader.ts).
 */
export interface ThemeDisplay {
  /** The field directly behind the current number. Contrast-validated against
   *  `number` at the strictest floor — this pairing IS the product. */
  background: string
  /** Optional edge wash: the stage darkens toward its edges (radial, center
   *  55% stays pure `background`, so the number's field is never touched).
   *  Omit for a flat stage. */
  backdrop?: string
  /** The current number. */
  number: string
  /** Optional glow AROUND the number's strokes (text-shadow). Sits outside
   *  the glyph, so it never dilutes number-vs-background contrast. */
  halo?: string
  /** The themed phrase under the number. */
  phrase: string
  /** Card behind the recent-calls tiles and any panel chrome. */
  panel?: string
  /** Called cell fill on the 1-90 board. */
  boardCalled: string
  /** Numeral on a called cell. Contrast-validated against `boardCalled`. */
  boardCalledText: string
  /** Uncalled cell fill. */
  boardUncalled: string
  /** Numeral on an uncalled cell. Softer floor — dimming uncalled numbers is
   *  intentional hierarchy, but they must not vanish. */
  boardUncalledText: string
  /** Ring around the freshest call on the board. */
  ring?: string
  /** Header/footer text (theme name, progress, operator hint). */
  chrome?: string
}

export interface Theme {
  /** Filename-safe, unique. */
  id: string
  /** Display name, shown in the theme picker. */
  name: string
  /** e.g. "hi-IN-latn" for roman Hinglish. */
  locale: string
  /** One line, shown in the theme picker. */
  description: string
  /** Optional display accent, "#rrggbb". Fallback phrase/board color for packs
   *  that don't define a full `display` block. Omitted -> the app's default
   *  amber. Pick a LIGHT, saturated color: it renders as large text on
   *  near-black and as a fill behind near-black text. */
  accent?: string
  /** Optional room-display identity. Omitted -> the app's default stage. */
  display?: ThemeDisplay
  /** All six standard dividends — no more, no less. Phrases only; milestones
   *  trigger no animation. */
  milestones: Record<MilestoneKey, ThemeMilestone>
  /** Keyed "1".."90" (JSON object keys are strings). All 90 must exist. */
  calls: Record<string, ThemeCall>
}
