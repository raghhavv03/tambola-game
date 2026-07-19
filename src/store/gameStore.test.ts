import { describe, it, expect, beforeEach } from 'vitest'
import { installMockLocalStorage } from '../test/mockLocalStorage'
import { useGameStore } from './gameStore'
import { createCaller } from '../engine/caller'

beforeEach(() => {
  installMockLocalStorage()
  useGameStore.getState().newGame() // fresh caller + reset fields before each test
})

describe('gameStore', () => {
  it('draw advances history and called, and autosaves without failing', () => {
    useGameStore.getState().draw()
    useGameStore.getState().draw()
    const state = useGameStore.getState()
    expect(state.history.length).toBe(2)
    expect(state.called.size).toBe(2)
    expect(state.currentNumber).toBe(state.history[1])
    expect(state.saveFailed).toBe(false)
  })

  it('loadSavedGame reconstructs exact state after N draws', () => {
    const reference = createCaller(99)
    const history: number[] = []
    for (let i = 0; i < 12; i++) history.push(reference.draw() as number)

    const ok = useGameStore.getState().loadSavedGame(99, history)
    expect(ok).toBe(true)

    const state = useGameStore.getState()
    expect(state.history).toEqual(reference.history)
    expect([...state.called]).toEqual([...reference.called])
    expect(state.currentNumber).toBe(history[history.length - 1])
    expect(state.drawSeq).toBe(12)
  })

  it('loadSavedGame reconstructs correctly after an undo', () => {
    const reference = createCaller(7)
    for (let i = 0; i < 5; i++) reference.draw()
    reference.undo() // net 4 draws

    const ok = useGameStore.getState().loadSavedGame(7, reference.history)
    expect(ok).toBe(true)
    expect(useGameStore.getState().history).toEqual(reference.history)
    expect(useGameStore.getState().history.length).toBe(4)
  })

  it('loadSavedGame rejects a mismatched history and leaves state untouched', () => {
    useGameStore.getState().draw()
    useGameStore.getState().draw()
    const before = useGameStore.getState().history

    const ok = useGameStore.getState().loadSavedGame(99, [1, 2, 3, 4, 5])
    expect(ok).toBe(false)
    expect(useGameStore.getState().history).toEqual(before)
  })

  it('newGame clears history and produces a fresh caller with a new seed', () => {
    const seedBefore = useGameStore.getState().seed
    useGameStore.getState().draw()
    useGameStore.getState().draw()

    useGameStore.getState().newGame()
    const state = useGameStore.getState()
    expect(state.history).toEqual([])
    expect(state.called.size).toBe(0)
    expect(state.currentNumber).toBeNull()
    expect(state.drawSeq).toBe(0)
    expect(state.seed).not.toBe(seedBefore)
  })
})
