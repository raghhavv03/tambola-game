/** Coarse, human relative time — this only needs to answer "is this stale?",
 *  not be precise. Used by the resume gate and the home screen's resume button. */
export function formatRelativeTime(timestampMs: number): string {
  const diffMs = Date.now() - timestampMs
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
