# KeyRush — Typing Racer

KeyRush is a browser-based typing-racing game. Accurate typing drives your vehicle along a 2D racing track in solo practice or in live private multiplayer against up to three friends.

## Features

- **Solo Practice** — 2D top-down Phaser 3 track with real-time character matching, error blocking, and live WPM / Accuracy metrics.
- **Private Multiplayer**
  - Create or join private lobbies via 6-character room codes or shareable `?room=CODE` links.
  - 2–4 players per room, host privileges, ready system, live socket-streamed lobby state.
  - Shared passage, synchronized 3-2-1 countdown, multi-car position streaming via Socket.IO.
  - Authoritative Node.js server validates readiness, start times, and finish rankings.
  - 15-second reconnection grace period and automatic host reassignment on disconnect.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Phaser 3, Lucide React |
| Backend | Node.js, Express 4, Socket.IO 4, TypeScript |
| Dev runner | `tsx` (no separate build step for the server) |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create a local .env (optional — localhost defaults are used without it)
cp .env.example .env

# 3. Start both client and server together
npm run dev
```

- Client dev server: `http://localhost:5173`  
- Backend + Socket.IO: `http://localhost:3001`  
- Health check: `http://localhost:3001/health`

To start servers separately:

```bash
npm run dev:server   # Terminal 1 — backend
npm run dev:client   # Terminal 2 — frontend (Vite)
```

### Testing multiplayer locally

1. `npm run dev`
2. Open `http://localhost:5173` in Window 1 → **Play with Friends → Create Room**. Copy the code.
3. Open an Incognito Window 2 at the same URL → **Play with Friends → Join Room** → paste the code.
4. Player 2 clicks **I Am Ready**. Host clicks **Start Race**.
5. Both players receive the synchronized countdown and race live.

---

## Environment Variables

### Frontend (`.env` in project root)

```env
# URL of the backend server (leave empty to use same origin in production)
VITE_SERVER_URL=http://localhost:3001
```

### Backend (`server/.env`)

```env
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

Copy the examples:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

---

## Production Deployment

### 1. Build the client

```bash
npm run build        # Outputs to dist/
```

### 2. Start the server

```bash
npm run start:server
```

The server:
- Serves the compiled `dist/` folder as static assets.
- Falls back to `dist/index.html` for client-side routing (SPA fallback).
- Handles all Socket.IO connections at the same origin, so no cross-origin issues.

> **No separate static hosting needed.** The single Express server handles both the API and the static frontend.

### 3. Environment variables for production

On your host (Render, Railway, Fly.io, etc.) set:

| Variable | Value |
|---|---|
| `PORT` | (provided by the host, e.g. `10000`) |
| `ALLOWED_ORIGINS` | Your production domain, e.g. `https://keyrush.example.com` |
| `NODE_ENV` | `production` |

On the **frontend** (if building on CI), set:

| Variable | Value |
|---|---|
| `VITE_SERVER_URL` | Leave **empty** — the frontend connects to the same origin as the page, which is correct when the Express server serves both. |

### Deployment example (Render)

1. Push to GitHub.
2. Create a **Web Service** on [render.com](https://render.com).
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm run start:server`
5. Add environment variables: `PORT`, `ALLOWED_ORIGINS`, `NODE_ENV=production`.
6. Done — Render assigns a public URL automatically.

---

## Project Structure

```
Keyrush/
├── src/                  # React frontend
│   ├── components/       # UI components (Lobby, Race, Results, etc.)
│   ├── game/             # Phaser 3 game scene and car sprites
│   ├── services/         # socketService.ts — Socket.IO client wrapper
│   ├── types/            # Shared TypeScript types (game.ts)
│   └── data/             # Typing passages (passages.ts)
├── server/               # Node.js / Express / Socket.IO backend
│   ├── index.ts          # Server entry point
│   └── roomManager.ts    # In-memory room + race state
├── .env.example          # Frontend env template
├── server/.env.example   # Backend env template
└── package.json
```
