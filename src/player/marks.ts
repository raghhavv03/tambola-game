// Where a player's own marks are kept between page loads.
//
// THE AIRGAP, precisely: the rule is that nothing may flow from the CALLER to the
// player's ticket. This module only ever moves the player's own taps to and from
// their own device, under a key derived from their own ticket ID. No other page in
// this app reads or writes this key prefix — `src/player/airgap.test.ts` fails the
// build if any module reachable from the host entry point so much as mentions it.
//
// Why store at all: a phone locks, a browser evicts a background tab, a thumb hits
// reload. Losing 40 minutes of marks mid-game is real damage, and the app is
// forbidden from helping the player reconstruct them (it must never reveal what was
// called). So the marks have to survive the reload themselves.

const KEY_PREFIX = 'tambola:marks:'

function storageKey(ticketId: string): string {
  return `${KEY_PREFIX}${ticketId}`
}

/**
 * Read back the marks for one ticket.
 *
 * Every failure path returns an empty set rather than throwing: private-mode Safari
 * throws on localStorage access, and a player whose storage is blocked should still
 * get a working ticket — they just lose reload-survival.
 */
export function loadMarks(ticketId: string): Set<number> {
  try {
    const raw = window.localStorage.getItem(storageKey(ticketId))
    if (raw === null) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((n): n is number => typeof n === 'number'))
  } catch {
    return new Set()
  }
}

/** Persist the marks for one ticket. Silently does nothing if storage is unavailable. */
export function saveMarks(ticketId: string, marks: Set<number>): void {
  try {
    window.localStorage.setItem(
      storageKey(ticketId),
      JSON.stringify([...marks]),
    )
  } catch {
    // Storage full or blocked. The in-memory marks still work for this page load.
  }
}
