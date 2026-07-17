// Theme pack validator. Runs once per pack at load time and throws loudly on
// any structural violation — THEME_PACK_GUIDE.md §7: "A missing key is a crash,
// not a fallback." Silently patching a broken pack would hide authoring bugs
// until mid-game, which is the worst possible time to find them.

import type { Theme, ThemeCall, ThemeMilestone } from './types'
import { MILESTONE_KEYS } from './types'

// Every problem found gets collected, then thrown as ONE error listing all of
// them — an author fixing a pack wants the full damage report, not one item
// per crash-and-rerun cycle.
//
// knownAnimComponents: the app's animation registry keys. When provided,
// every animations-map VALUE must be one of them — a pack naming a component
// that doesn't exist should die at load, not render nothing mid-game. Passed
// as a parameter (not imported) so this module stays a pure function with no
// app dependencies, which also keeps the tests trivial.
export function validateTheme(
  data: unknown,
  source: string,
  knownAnimComponents?: ReadonlySet<string>,
): Theme {
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

  // --- animations: the theme-owned registry every anim key must resolve to ---
  const animations = pack.animations
  const animKeys = new Set<string>()
  if (typeof animations !== 'object' || animations === null) {
    errors.push('"animations" must be an object')
  } else {
    for (const [key, value] of Object.entries(animations)) {
      if (typeof value !== 'string' || value === '') {
        errors.push(`animations["${key}"] must be a component key (string)`)
      } else if (knownAnimComponents && !knownAnimComponents.has(value)) {
        errors.push(
          `animations["${key}"]: component "${value}" is not in the app's ` +
            `animation registry (known: ${[...knownAnimComponents].join(', ')})`,
        )
      }
      animKeys.add(key)
    }
    if (animKeys.size === 0) {
      errors.push('"animations" must not be empty')
    }
  }

  const checkAnimResolves = (anim: unknown, where: string) => {
    if (typeof anim !== 'string') {
      errors.push(`${where}: "anim" must be a string`)
    } else if (!animKeys.has(anim)) {
      errors.push(
        `${where}: anim "${anim}" not found in this theme's animations map`,
      )
    }
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
      checkAnimResolves(milestone.anim, `milestones["${key}"]`)
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
      checkAnimResolves(c.anim, `calls["${n}"]`)
      if (typeof c.intensity !== 'number' || ![1, 2, 3].includes(c.intensity)) {
        errors.push(`calls["${n}"]: "intensity" must be 1, 2, or 3`)
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
