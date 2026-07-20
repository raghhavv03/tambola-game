import type { CapacitorConfig } from '@capacitor/cli'

// Native Android wrapper around the exact web build (webDir = the Vite `dist`).
// Same codebase, no rewrite — Capacitor loads the bundled assets in a WebView.
//
// AIRGAP NOTE: this wraps the HOST app only. Players never install anything; they
// scan a QR that opens `/t` in their own phone browser. Inside the native app,
// `window.location.origin` is `http://localhost`, which a player's phone cannot
// open — so ticket QRs must encode the DEPLOYED web origin instead. That is set
// via `VITE_TICKET_ORIGIN` at build time and read in TicketsPanel; see there.
const config: CapacitorConfig = {
  appId: 'com.raghavgupta.tambola',
  appName: 'Tambola Host',
  webDir: 'dist',
}

export default config
