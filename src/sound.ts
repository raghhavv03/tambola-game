// Speaks the drawn number's themed phrase for the HOST. Two paths:
//   1. a recorded clip, if the pack ships theme.calls[n].audio (none do today —
//      this path is dormant but ready), or
//   2. the Web Speech API (browser TTS) as the fallback.
// Host-only: never imported under src/player/. Nothing here reaches the caller
// or the network — it only voices a string it is handed.
//
// Every browser API is feature-detected so this module imports cleanly in the
// node test environment (no window/speechSynthesis there).

/**
 * A BCP-47 lang tag for SpeechSynthesis, derived from a theme locale by dropping
 * a script subtag. "hi-IN-latn" -> "hi-IN": the phrases are romanized Hindi, so
 * a script tag would only confuse voice selection. Best-effort — no system voice
 * reads roman-script Hindi cleanly, which is exactly why recorded clips are the
 * real path once a pack ships them.
 */
export function langFromLocale(locale: string): string {
  const parts = locale.split('-')
  // Keep the language and, if present, a region (2 letters or 3 digits); drop a
  // 4-letter script subtag like "latn" and anything after it.
  const kept = parts.filter((part, i) => i < 2 || /^[A-Za-z]{2}$|^\d{3}$/.test(part))
  // After index 1 we only want a region, not a script — take at most lang+region.
  return kept.slice(0, 2).join('-')
}

// Preloaded clips, keyed by URL, so a clip is ready before its number is drawn.
const clips = new Map<string, HTMLAudioElement>()

export function preloadAudio(urls: string[]): void {
  if (typeof Audio === 'undefined') return
  for (const url of urls) {
    if (clips.has(url)) continue
    const audio = new Audio(url)
    audio.preload = 'auto'
    clips.set(url, audio)
  }
}

export function speak(text: string, opts: { lang?: string; audioUrl?: string } = {}): void {
  if (!text) return

  // Path 1: a recorded clip for this call.
  if (opts.audioUrl) {
    const existing = clips.get(opts.audioUrl)
    const audio = existing ?? (typeof Audio !== 'undefined' ? new Audio(opts.audioUrl) : null)
    if (audio) {
      audio.currentTime = 0
      void audio.play().catch(() => {
        // Autoplay/decoding can fail; a silent miss is fine for a caller aid.
      })
      return
    }
  }

  // Path 2: Web Speech API TTS.
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel() // never queue — the newest number wins
  const utterance = new SpeechSynthesisUtterance(text)
  if (opts.lang) utterance.lang = opts.lang
  window.speechSynthesis.speak(utterance)
}
