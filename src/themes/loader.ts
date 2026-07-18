// Theme pack validator. Runs once per pack at load time and throws loudly on
// any structural violation — THEME_PACK_GUIDE.md §7: "A missing key is a crash,
// not a fallback." Silently patching a broken pack would hide authoring bugs
// until mid-game, which is the worst possible time to find them.

import type { Theme, ThemeCall, ThemeDisplay, ThemeMilestone } from './types'
import { MILESTONE_KEYS } from './types'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

// --- WCAG contrast math --------------------------------------------------------
//
// Standard relative-luminance contrast (WCAG 2.x). Used at LOAD TIME to reject a
// display palette whose information-carrying pairs would be unreadable — the
// legibility floor is enforced here, in data validation, so the renderer never
// has to defend itself against a bad palette.

function channelToLinear(byte: number): number {
  const c = byte / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance(hex: string): number {
  const r = channelToLinear(parseInt(hex.slice(1, 3), 16))
  const g = channelToLinear(parseInt(hex.slice(3, 5), 16))
  const b = channelToLinear(parseInt(hex.slice(5, 7), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two "#rrggbb" colors: 1 (none) to 21 (max). */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA)
  const lb = relativeLuminance(hexB)
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la]
  return (lighter + 0.05) / (darker + 0.05)
}

// The floors. Read from 4 metres by a 79-year-old in a lit room:
//   - the NUMBER is the product; 7:1 (WCAG AAA body-text level) leaves margin
//     for projector washout and cheap TV panels.
//   - phrase and called-cell numerals are secondary but still information: 4.5:1.
//   - uncalled board numerals are deliberately quiet (the dimming IS the
//     hierarchy) but must not vanish: 3:1.
export const CONTRAST_FLOORS = {
  number: 7,
  phrase: 4.5,
  boardCalledText: 4.5,
  boardUncalledText: 3,
} as const

export function validateTheme(data: unknown, source: string): Theme {
  const errors: string[] = []

  if (typeof data !== 'object' || data === null) {
    throw new Error(`Theme pack ${source}: not a JSON object`)
  }
  // From here we probe fields one by one, so treat it as a loose record.
  const pack = data as Record<string, unknown>

  for (const field of ['id', 'name', 'locale', 'description'] as const) {
    if (typeof pack[field] !== 'string' || pack[field] === '') {
      errors.push(`"${field}" must be a non-empty string`)
    }
  }

  // --- accent: optional, but if present it must be a real color ------------
  // Feeds straight into CSS: a malformed value would not crash there — it
  // would silently render the DEFAULT color, which is the "silent fallback"
  // §7 forbids. So a bad accent dies at load like everything else.
  if (pack.accent !== undefined) {
    if (typeof pack.accent !== 'string' || !HEX_COLOR.test(pack.accent)) {
      errors.push('"accent" must be a "#rrggbb" hex color when present')
    }
  }

  // --- display: optional block; when present, colors AND contrast validate ---
  if (pack.display !== undefined) {
    validateDisplay(pack.display, errors)
  }

  // --- milestones: exactly the six standard dividends -----------------------
  const milestones = pack.milestones
  if (typeof milestones !== 'object' || milestones === null) {
    errors.push('"milestones" must be an object')
  } else {
    const found = milestones as Record<string, unknown>
    for (const key of MILESTONE_KEYS) {
      const m = found[key]
      if (typeof m !== 'object' || m === null) {
        errors.push(`milestones missing "${key}"`)
        continue
      }
      const milestone = m as Partial<ThemeMilestone>
      if (typeof milestone.phrase !== 'string' || milestone.phrase === '') {
        errors.push(`milestones["${key}"]: "phrase" must be a non-empty string`)
      }
    }
  }

  // --- calls: all 90, each structurally sound -------------------------------
  const calls = pack.calls
  if (typeof calls !== 'object' || calls === null) {
    errors.push('"calls" must be an object')
  } else {
    const found = calls as Record<string, unknown>
    for (let n = 1; n <= 90; n++) {
      const call = found[String(n)]
      if (typeof call !== 'object' || call === null) {
        errors.push(`calls missing "${n}"`)
        continue
      }
      const c = call as Partial<ThemeCall>
      if (typeof c.phrase !== 'string' || c.phrase === '') {
        errors.push(`calls["${n}"]: "phrase" must be a non-empty string`)
      }
      if (typeof c.sub !== 'string' || c.sub === '') {
        errors.push(`calls["${n}"]: "sub" must be a non-empty string`)
      }
    }
  }

  if (errors.length > 0) {
    const id = typeof pack.id === 'string' ? pack.id : '<no id>'
    throw new Error(
      `Theme pack "${id}" (${source}) is invalid — ${errors.length} problem(s):\n` +
        errors.map((e) => `  - ${e}`).join('\n'),
    )
  }

  return pack as unknown as Theme
}

// The display block's contract, in one place: which keys must exist, which may,
// and which pairs owe the room a minimum contrast.
const DISPLAY_REQUIRED = [
  'background',
  'number',
  'phrase',
  'boardCalled',
  'boardCalledText',
  'boardUncalled',
  'boardUncalledText',
] as const

const DISPLAY_OPTIONAL = ['backdrop', 'halo', 'panel', 'ring', 'chrome'] as const

function validateDisplay(data: unknown, errors: string[]): void {
  if (typeof data !== 'object' || data === null) {
    errors.push('"display" must be an object when present')
    return
  }
  const display = data as Record<string, unknown>

  // Unknown keys are authoring mistakes (a typo'd token would otherwise be
  // silently ignored, i.e. a silent fallback to the default for that token).
  const known: ReadonlySet<string> = new Set([
    ...DISPLAY_REQUIRED,
    ...DISPLAY_OPTIONAL,
  ])
  for (const key of Object.keys(display)) {
    if (!known.has(key)) {
      errors.push(`display["${key}"] is not a recognized display token`)
    }
  }

  let colorsOk = true
  for (const key of DISPLAY_REQUIRED) {
    const value = display[key]
    if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
      errors.push(`display["${key}"] must be a "#rrggbb" hex color`)
      colorsOk = false
    }
  }
  for (const key of DISPLAY_OPTIONAL) {
    const value = display[key]
    if (value !== undefined && (typeof value !== 'string' || !HEX_COLOR.test(value))) {
      errors.push(`display["${key}"] must be a "#rrggbb" hex color when present`)
      colorsOk = false
    }
  }
  // Contrast math needs well-formed colors; bail if any required one is broken
  // (the format errors above already explain why).
  if (!colorsOk) return

  const d = display as unknown as ThemeDisplay

  // The legibility floor, enforced as data validation. Each entry: the pair
  // that must clear its floor and the background it's read against.
  const checks: Array<{
    label: string
    fg: string
    bg: string
    floor: number
  }> = [
    {
      label: 'number on background',
      fg: d.number,
      bg: d.background,
      floor: CONTRAST_FLOORS.number,
    },
    {
      label: 'phrase on background',
      fg: d.phrase,
      bg: d.background,
      floor: CONTRAST_FLOORS.phrase,
    },
    {
      label: 'boardCalledText on boardCalled',
      fg: d.boardCalledText,
      bg: d.boardCalled,
      floor: CONTRAST_FLOORS.boardCalledText,
    },
    {
      label: 'boardUncalledText on boardUncalled',
      fg: d.boardUncalledText,
      bg: d.boardUncalled,
      floor: CONTRAST_FLOORS.boardUncalledText,
    },
  ]

  for (const { label, fg, bg, floor } of checks) {
    const ratio = contrastRatio(fg, bg)
    if (ratio < floor) {
      errors.push(
        `display contrast too low: ${label} is ${ratio.toFixed(2)}:1, ` +
          `floor is ${floor}:1 — unreadable from the back of the room`,
      )
    }
  }
}
