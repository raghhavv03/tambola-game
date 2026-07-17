// Shape of a theme pack JSON file (see themes/mythology.json and
// THEME_PACK_GUIDE.md). This describes DATA, not behavior — the renderer must
// stay theme-agnostic, so this type is the contract between the two.

export interface ThemeCall {
  phrase: string
  sub: string
  anim: string
  intensity: number
  mech: string
  note?: string
}

export interface ThemeMilestone {
  phrase: string
  anim: string
}

export interface ThemePack {
  id: string
  name: string
  locale: string
  description: string
  animations: Record<string, string>
  milestones: Record<string, ThemeMilestone>
  // Keyed by number as a string ("1".."90") because that's how it comes out
  // of JSON — object keys are always strings, even when they look numeric.
  calls: Record<string, ThemeCall>
}
