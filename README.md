# Tambola Host 🎯

> **A themed number caller & teleprompter for human hosts running physical Tambola (Housie) games.**

The host is the performer, the phone is the teleprompter, and the room is the stage. **Tambola Host** is designed as a physical party prop—not a automated digital game platform.

---

## 💡 Core Philosophy

Traditional automation destroys the joy of Tambola. This project is built around strict design principles enforced **structurally at build time**:

- **No Auto-Marking:** The app never marks tickets automatically. Listening for numbers and marking them on paper or phone *is* the game.
- **No Player Hints:** No highlight, pulsing, or notifications for missed numbers.
- **No Auto-Calling:** The host manual draws every number. No automated timer or forced pace.
- **Strict Airgap:** Player tickets (`/t`) receive data solely from the QR code URL. The player app bundle has **zero network connection, sockets, or shared state** with the host caller.

---

## ✨ Key Features

- **📱 Interactive Host Controller:** Giant number displays, themed phrases to read aloud, 1–90 board tracking, history log, and instant claim verification.
- **🎨 Theme Pack System:** Drop-in pure JSON theme packs (`themes/*.json`) with zero component modifications needed. Includes *Mythology (Puranic)* and *Minimal Plain* themes out of the box.
- **📺 Room / Stage Display:** Dedicated TV/Projector layout (`/?display=1`) for broadcasting the called board to large screens via HDMI or casting.
- **🛡️ Airgapped Player Tickets:** Independent ticket route (`/t#<id>`) compiled as a isolated JS bundle with automated build-time static import assertions (`src/player/airgap.test.ts`).
- **⚡ Offline-First PWA & Native Android:** Installable web application with complete offline service worker precaching, plus native Android wrapper via Capacitor.

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Animations:** [Motion](https://motion.dev/)
- **Testing:** [Vitest](https://vitest.dev/)
- **PWA & Mobile:** `vite-plugin-pwa` + [Capacitor](https://capacitorjs.com/)

---

## 🚀 Application Surfaces

| Surface | Route | Description |
| :--- | :--- | :--- |
| **Home Door** | `/` | Select theme preview cards, configure rules, start or resume games. |
| **Host Caller** | `/` *(Active Game)* | Draw numbers 1–90, view themed phrases, board matrix, undo, and cast. |
| **Player Ticket** | `/t#<id>` | Scanned ticket surface for players. Completely airgapped from caller state. |
| **Room Display** | `/?display=1` | Stage view for TVs and projectors showing the live called numbers board. |

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **pnpm**

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/tambola-host.git
   cd tambola-host
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser. Access `http://localhost:5173/?display=1` for the Stage view.

---

## 🧪 Testing & Building

```bash
# Run unit & airgap boundary tests
npm test

# Type-check & generate production web build (PWA & Service Worker)
npm run build

# Preview production build locally
npm run preview

# Sync Capacitor native Android app
npm run cap:sync
```

---

## 📚 Documentation & Guides

- 🎨 **[Theme Pack Authoring Guide](THEME_PACK_GUIDE.md):** How to create and register custom JSON theme packs.
- 📖 **[Runbook & Native Android Deployment](RUNBOOK.md):** Build sequences, PWA configuration, and Android Play Store packaging.
- 🎨 **[UI & Token Inventory](UI_INVENTORY.md):** Element-by-element design token breakdown and theme mapping.

---

## 📄 License

MIT License. Developed for hosting fun, physical Housie / Tambola events!
