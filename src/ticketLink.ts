// The one place that knows the shape of a player's ticket URL.
//
// Shared by the host (which builds the link and draws it as a QR) and by /t (which
// reads it back). Sharing this module does NOT breach THE AIRGAP: it moves a URL
// format, not game state. Nothing here can tell /t what has been called.
//
// Shape: https://<host>/t#K3P9Z-04
//
// The ID lives in the FRAGMENT, after the '#', on purpose. Fragments are never sent
// to a server, never land in access logs, never leak through the Referer header. This
// app has no backend, but a static host still logs paths — the ticket stays client-side
// no matter where it's deployed.

/** The route the player's ticket renders at. */
export const PLAYER_ROUTE = '/t'

/** Absolute URL to encode into a QR, e.g. "http://192.168.1.5:5173/t#K3P9Z-04". */
export function ticketUrl(origin: string, ticketId: string): string {
  return `${origin}${PLAYER_ROUTE}#${ticketId}`
}

/**
 * Pull the ticket ID out of a location hash. Returns null when there isn't one, so
 * /t can show "this link is incomplete" instead of a broken grid.
 */
export function ticketIdFromHash(hash: string): string | null {
  const id = hash.replace(/^#/, '').trim()
  return id.length > 0 ? id : null
}
