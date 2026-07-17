// The app's animation component registry. Theme packs reference these KEYS in
// their `animations` map values — the renderer resolves
// registry[theme.animations[call.anim]] and never knows which theme it's
// serving. Theme JSONs are validated against this key set at load, so a pack
// naming a component that doesn't exist crashes at startup, not mid-game.

import type { ComponentType } from 'react'
import type { AnimComponentProps } from './shared'
import { DefaultAnim } from './DefaultAnim'
import { TrishulAnim } from './TrishulAnim'
import { DamruAnim } from './DamruAnim'
import { MountainAnim } from './MountainAnim'
import { StarsAnim } from './StarsAnim'
import { OmAnim } from './OmAnim'
import { ChakraAnim } from './ChakraAnim'
import { DiyaAnim } from './DiyaAnim'
import { ConchAnim } from './ConchAnim'
import { FireRingAnim } from './FireRingAnim'
import { LotusAnim } from './LotusAnim'
import { BowAnim } from './BowAnim'
import { PeacockAnim } from './PeacockAnim'
import { SwanAnim } from './SwanAnim'
import { ThaliAnim } from './ThaliAnim'
import { AartiAnim } from './AartiAnim'

export const animRegistry: Record<string, ComponentType<AnimComponentProps>> = {
  default: DefaultAnim,
  trishul: TrishulAnim,
  damru: DamruAnim,
  mountain: MountainAnim,
  stars: StarsAnim,
  om: OmAnim,
  chakra: ChakraAnim,
  diya: DiyaAnim,
  conch: ConchAnim,
  fire_ring: FireRingAnim,
  lotus: LotusAnim,
  bow: BowAnim,
  peacock: PeacockAnim,
  swan: SwanAnim,
  thali: ThaliAnim,
  aarti: AartiAnim,
}
