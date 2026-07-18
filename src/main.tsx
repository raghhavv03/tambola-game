import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PLAYER_ROUTE } from './ticketLink'

// Two entry points, not one app with a route inside it.
//
// The host screen and the player's ticket are loaded by SEPARATE dynamic imports, so
// they end up in separate bundles with separate module graphs. The player's chunk
// physically does not contain the caller, the game store, or anything that could
// reach them — that's THE AIRGAP made structural rather than merely intended.
//
// Do not "simplify" this into a shared component tree with a conditional render.
// The split is the safety property.

const root = createRoot(document.getElementById('root')!)

const isPlayerRoute =
  window.location.pathname === PLAYER_ROUTE ||
  window.location.pathname === `${PLAYER_ROUTE}/`

if (isPlayerRoute) {
  void import('./player/PlayerApp').then(({ PlayerApp }) => {
    root.render(
      <StrictMode>
        <PlayerApp />
      </StrictMode>,
    )
  })
} else {
  void import('./App').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
}
