// Shared bits for animation components. Every anim receives the call's
// intensity and scales itself from this one table, so the "1 = accent,
// 2 = flourish, 3 = full-screen moment" rule lives in exactly one place.

export interface AnimComponentProps {
  /** 1 plain | 2 working | 3 hero — from the theme call, validated at load. */
  intensity: number
}

interface IntensityPreset {
  /** CSS size of the square stage the SVG renders in. */
  box: string
  /** Total duration budget in seconds — the WHOLE reaction, fade-out included.
   *  Hard ceiling ~1.5s: the host keeps talking over it and the room is
   *  looking at paper tickets, not the screen. */
  dur: number
}

const PRESETS: Record<number, IntensityPreset> = {
  1: { box: 'min(18vw, 18vh)', dur: 0.45 },
  2: { box: 'min(42vw, 42vh)', dur: 0.8 },
  3: { box: 'min(85vw, 85vh)', dur: 1.25 },
}

export function presetFor(intensity: number): IntensityPreset {
  // Intensity is validated 1-3 at theme load; the ?? is belt-and-braces for
  // the preview tool, not a theme fallback.
  return PRESETS[intensity] ?? PRESETS[1]
}

// The app's accent palette, kept here so all anims stay on one scheme.
export const AMBER = '#f59e0b'
export const AMBER_SOFT = '#fde68a'
export const WHITE_DIM = 'rgba(255,255,255,0.35)'

/** Standard whole-SVG opacity envelope: quick fade in, hold, fade out.
 *  Putting this on the root <svg> guarantees the reaction is fully gone by
 *  the end of its duration budget no matter what the inner parts do. */
export const FADE_KEYFRAMES = { opacity: [0, 1, 1, 0] }
export const FADE_TIMES = [0, 0.12, 0.72, 1]
