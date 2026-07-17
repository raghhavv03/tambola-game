import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts on purpose: the engine is pure TypeScript with no
// React or CSS, so tests don't need the React/Tailwind plugins. 'node' environment
// = no browser DOM, which is all the engine needs and keeps tests fast.
export default defineConfig({
  test: {
    environment: 'node',
  },
})
