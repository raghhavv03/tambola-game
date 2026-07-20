// localStorage persistence for HOST-ONLY game state — the caller's seed +
// draw history, and the bogey tally. Keys use the `tambola:host:` prefix,
// disjoint from the player's mark-storage prefix (see the KEY_PREFIX constant
// in src/player/marks.ts): airgap.test.ts asserts no file reachable from the
// host entry point names that other prefix (written out literally, not just
// referenced, so the check can't be satisfied by a comment) — and this
// module is never imported under src/player/.
//
// Reads degrade silently to "nothing found" on any parse failure — same as
// marks.ts's precedent, because a host whose storage is blocked should still
// get a working (if unsaved) game.
//
// Writes are different: losing draw history mid-party is a bigger deal than
// losing a player's tap-marks, so a failed write is reported back (boolean)
// rather than swallowed, and warns to the console. The caller (gameStore /
// claimStore) decides how to surface that to the host.

const GAME_KEY = 'tambola:host:game'
const BOGEYS_KEY = 'tambola:host:bogeys'

export interface PersistedGame {
  seed: number
  history: number[]
  savedAt: number
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJSON(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    console.warn(`tambola: failed to save "${key}" to localStorage`, err)
    return false
  }
}

export function saveGame(seed: number, history: number[]): boolean {
  const game: PersistedGame = { seed, history, savedAt: Date.now() }
  return writeJSON(GAME_KEY, game)
}

export function loadGame(): PersistedGame | null {
  const parsed = readJSON<PersistedGame>(GAME_KEY)
  if (parsed === null) return null
  if (typeof parsed.seed !== 'number' || !Array.isArray(parsed.history)) {
    return null // shape doesn't match what we ever wrote — treat as absent
  }
  return parsed
}

export function clearGame(): void {
  try {
    window.localStorage.removeItem(GAME_KEY)
  } catch {
    // Nothing to do — if storage is blocked there was nothing persisted anyway.
  }
}

export function saveBogeys(bogeys: Record<string, number>): boolean {
  return writeJSON(BOGEYS_KEY, bogeys)
}

export function loadBogeys(): Record<string, number> {
  const parsed = readJSON<Record<string, number>>(BOGEYS_KEY)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {}
  }
  if (!Object.values(parsed).every((v) => typeof v === 'number')) {
    return {} // shape doesn't match what we ever wrote — treat as absent
  }
  return parsed
}

export function clearBogeys(): void {
  try {
    window.localStorage.removeItem(BOGEYS_KEY)
  } catch {
    // Nothing to do — see clearGame().
  }
}

const SETTINGS_KEY = 'tambola:host:settings'

export interface PersistedSettings {
  ttsEnabled: boolean
  reducedMotion: boolean
}

// Speaking numbers aloud is opt-in (no surprise audio on first open); reduced
// motion defaults to "follow the OS" (false = don't force it).
const DEFAULT_SETTINGS: PersistedSettings = { ttsEnabled: false, reducedMotion: false }

export function saveSettings(settings: PersistedSettings): boolean {
  return writeJSON(SETTINGS_KEY, settings)
}

export function loadSettings(): PersistedSettings {
  const parsed = readJSON<Partial<PersistedSettings>>(SETTINGS_KEY)
  if (parsed === null || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS }
  // Validate each field independently so one corrupt flag can't discard the other.
  return {
    ttsEnabled:
      typeof parsed.ttsEnabled === 'boolean' ? parsed.ttsEnabled : DEFAULT_SETTINGS.ttsEnabled,
    reducedMotion:
      typeof parsed.reducedMotion === 'boolean'
        ? parsed.reducedMotion
        : DEFAULT_SETTINGS.reducedMotion,
  }
}
