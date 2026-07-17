// Theme pack types — mirrors THEME_PACK_GUIDE.md §7 exactly. Themes are DATA:
// the renderer reads these shapes and must never special-case any one pack.

export interface ThemeCall {
  /** Spoken verbatim by the host. */
  phrase: string
  /** Big display glyph for this number. */
  sub: string
  /** Optional recorded audio; TTS fallback if absent. */
  audio?: string
  /** Key into this theme's own `animations` map — never a file path itself. */
  anim: string
  /** 1 plain | 2 working | 3 hero — drives reaction size. */
  intensity: number
  /** BUILD-TIME ONLY (authoring discipline: REF | SHAPE | SOUND | COMP).
   *  The app must never read this — it exists for pack editors. */
  mech?: string
  /** BUILD-TIME ONLY (editor's judgement note). The app must never read this. */
  note?: string
}

export interface ThemeMilestone {
  phrase: string
  /** Key into this theme's own `animations` map. */
  anim: string
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

export interface Theme {
  /** Filename-safe, unique. */
  id: string
  /** Display name, shown in the theme picker. */
  name: string
  /** e.g. "hi-IN-latn" for roman Hinglish. */
  locale: string
  /** One line, shown in the theme picker. */
  description: string
  /** Theme-owned animation registry. Renderer does theme.animations[anim]. */
  animations: Record<string, string>
  /** All six standard dividends — no more, no less. */
  milestones: Record<MilestoneKey, ThemeMilestone>
  /** Keyed "1".."90" (JSON object keys are strings). All 90 must exist. */
  calls: Record<string, ThemeCall>
}
