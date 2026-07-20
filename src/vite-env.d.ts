/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Deployed web origin the ticket QRs should point at, for the native build.
   *  Unset on web builds (falls back to window.location.origin). */
  readonly VITE_TICKET_ORIGIN?: string
}
