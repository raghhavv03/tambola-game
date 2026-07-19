import { describe, it, expect, beforeEach } from 'vitest'
import { installMockLocalStorage } from '../test/mockLocalStorage'
import { useGameStore } from './gameStore'
import { useClaimStore } from './claimStore'
import { resumeGame, startNewGame } from './gameSession'
import { createCaller } from '../engine/caller'
import * as persist from './persist'

beforeEach(() => {
  installMockLocalStorage()
  startNewGame() // clean slate before every test
})

describe('resumeGame', () => {
  it('hydrates both stores together on a valid save', () => {
    const reference = createCaller(55)
    const history: number[] = []
    for (let i = 0; i < 8; i++) history.push(reference.draw() as number)
    persist.saveBogeys({ 'K3P9Z-04': 3 })

    const result = resumeGame(55, history)

    expect(result).toEqual({ ok: true })
    expect(useGameStore.getState().history).toEqual(reference.history)
    expect(useClaimStore.getState().bogeys).toEqual({ 'K3P9Z-04': 3 })
  })

  it('wipes both stores and reports why on a mismatched replay', () => {
    useClaimStore.getState().record({
      ticketId: 'X',
      dividend: 'earlyFive',
      valid: false,
      atCall: 1,
    })

    const result = resumeGame(55, [1, 2, 3]) // not a real draw sequence for seed 55

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/new game/i)
    expect(useGameStore.getState().history).toEqual([])
    expect(useClaimStore.getState().bogeys).toEqual({})
  })
})

describe('startNewGame', () => {
  it('clears both stores and both persisted keys', () => {
    useGameStore.getState().draw()
    useClaimStore.getState().record({
      ticketId: 'X',
      dividend: 'earlyFive',
      valid: false,
      atCall: 1,
    })

    startNewGame()

    expect(useGameStore.getState().history).toEqual([])
    expect(useClaimStore.getState().bogeys).toEqual({})
    expect(persist.loadGame()).toBeNull()
    expect(persist.loadBogeys()).toEqual({})
  })

  it('produces a different seed than the previous game', () => {
    const firstSeed = useGameStore.getState().seed
    startNewGame()
    const secondSeed = useGameStore.getState().seed
    expect(secondSeed).not.toBe(firstSeed)
  })
})
