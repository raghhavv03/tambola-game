// Shared localStorage stub for store tests. Vitest's node environment has no
// global `window`/`localStorage` (unlike a browser), and persist.ts (like
// player/marks.ts before it) reads `window.localStorage` directly, so tests
// stub `window` itself rather than mocking a module.

import { vi } from 'vitest'

export interface MockLocalStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  /** Force the next write to throw, simulating full/blocked storage. */
  failNextWrite(): void
}

export function installMockLocalStorage(): MockLocalStorage {
  const data = new Map<string, string>()
  let shouldFailNextWrite = false

  const store: MockLocalStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      if (shouldFailNextWrite) {
        shouldFailNextWrite = false
        throw new Error('storage full (simulated)')
      }
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
    failNextWrite: () => {
      shouldFailNextWrite = true
    },
  }

  vi.stubGlobal('window', { localStorage: store })
  return store
}
