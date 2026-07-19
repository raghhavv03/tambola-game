// localStorage persistence for HOST-ONLY game state — the caller's seed +
// draw history, and the bogey tally. Keys use the `tambola:host:` prefix,
// disjoint from the player's `tambola:marks:` prefix (src/player/marks.ts):
// airgap.test.ts asserts no file reachable from the host entry point names
// that OTHER prefix, and this module is never imported under src/player/.
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
  return readJSON<Record<string, number>>(BOGEYS_KEY) ?? {}
}

export function clearBogeys(): void {
  try {
    window.localStorage.removeItem(BOGEYS_KEY)
  } catch {
    // Nothing to do — see clearGame().
  }
}
