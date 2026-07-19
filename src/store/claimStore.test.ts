import { describe, it, expect, beforeEach } from 'vitest'
import { installMockLocalStorage } from '../test/mockLocalStorage'
import { useClaimStore } from './claimStore'

beforeEach(() => {
  installMockLocalStorage()
  useClaimStore.getState().reset()
})

describe('claimStore', () => {
  it('records an invalid ruling and increments the bogey tally, without failing to save', () => {
    useClaimStore.getState().record({
      ticketId: 'K3P9Z-04',
      dividend: 'fullHouse',
      valid: false,
      atCall: 40,
    })
    expect(useClaimStore.getState().bogeys['K3P9Z-04']).toBe(1)
    expect(useClaimStore.getState().saveFailed).toBe(false)
  })

  it('does not tally a valid ruling', () => {
    useClaimStore.getState().record({
      ticketId: 'K3P9Z-04',
      dividend: 'fullHouse',
      valid: true,
      atCall: 40,
    })
    expect(useClaimStore.getState().bogeys['K3P9Z-04']).toBeUndefined()
  })

  it('loadSavedBogeys restores a tally exactly, simulating a reload', () => {
    useClaimStore.getState().record({
      ticketId: 'ABCDE-01',
      dividend: 'topLine',
      valid: false,
      atCall: 10,
    })
    useClaimStore.getState().record({
      ticketId: 'ABCDE-01',
      dividend: 'corners',
      valid: false,
      atCall: 20,
    })
    const saved = useClaimStore.getState().bogeys

    useClaimStore.getState().reset() // simulate a fresh module state after reload
    expect(useClaimStore.getState().bogeys).toEqual({})

    useClaimStore.getState().loadSavedBogeys(saved)
    expect(useClaimStore.getState().bogeys).toEqual({ 'ABCDE-01': 2 })
  })

  it('reset clears the tally', () => {
    useClaimStore.getState().record({
      ticketId: 'X',
      dividend: 'earlyFive',
      valid: false,
      atCall: 5,
    })
    useClaimStore.getState().reset()
    expect(useClaimStore.getState().bogeys).toEqual({})
  })
})
