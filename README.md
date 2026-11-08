# KeyRush — Multiplayer Typing Racer

<p align="center">
  <strong>Type Fast. Drive Faster. Race to the Finish.</strong>
  <br />
  A real-time multiplayer typing-racing game built with React, TypeScript, Phaser 3, Node.js and Socket.IO.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Phaser-3-8A2BE2" alt="Phaser 3" />
  <img src="https://img.shields.io/badge/Socket.IO-4-black?logo=socketdotio" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite" />
</p>

---

## 🚀 Live Demo

**Play KeyRush:** https://keyrush-3qzt.onrender.com/

Experience real-time typing races, practice your typing speed, and compete with friends in multiplayer mode.

**Deployment:** Render

## 🌐 Deployment

KeyRush is deployed on Render.

- **Live Website:** https://keyrush-3qzt.onrender.com/
- **Hosting Platform:** Render
- **Health Check:** https://keyrush-3qzt.onrender.com/health
- **Frontend:** React + Vite
- **Backend:** Node.js + Express + Socket.IO

The Express server serves the production frontend and handles multiplayer communication through Socket.IO.


## Table of Contents

1. [Overview](#overview)
2. [Project Highlights](#project-highlights)
3. [Features](#features)
4. [How KeyRush Works](#how-keyrush-works)
5. [Game Modes](#game-modes)
6. [Multiplayer Architecture](#multiplayer-architecture)
7. [Typing and Race Mechanics](#typing-and-race-mechanics)
8. [Player Progression and Statistics](#player-progression-and-statistics)
9. [Technology Stack](#technology-stack)
10. [System Architecture](#system-architecture)
11. [Project Structure](#project-structure)
12. [Data Storage](#data-storage)
13. [Environment Variables](#environment-variables)
14. [Installation and Local Setup](#installation-and-local-setup)
15. [Running the Application](#running-the-application)
16. [Testing Multiplayer Locally](#testing-multiplayer-locally)
17. [Production Build](#production-build)
18. [Deployment](#deployment)
19. [Security and Reliability](#security-and-reliability)
20. [Responsive Design](#responsive-design)
21. [Troubleshooting](#troubleshooting)
22. [Current Scope and Limitations](#current-scope-and-limitations)
23. [Future Improvements](#future-improvements)
24. [Git Workflow](#git-workflow)
25. [Author](#author)

---

## 1. Overview

**KeyRush** is a browser-based typing-racing game that transforms typing speed and accuracy into a competitive racing experience.

Instead of simply measuring words per minute, KeyRush turns every correctly typed character into forward movement on a racing circuit.

Players can:

- Practice typing independently in Solo Practice.
- Create private multiplayer rooms and race against friends.
- Compete using the same typing passage.
- Monitor typing speed, accuracy, and race progress.
- Review previous races and performance statistics.
- Track personal progression, achievements, and leaderboard performance.

The central gameplay mechanic is simple:

**Correct typing moves your car forward. Typing errors interrupt your progress until corrected.**

KeyRush combines a React-based application interface, Phaser-powered racing visualization, and a Socket.IO multiplayer backend.

### Project Goals

- Make typing practice more engaging through racing mechanics.
- Reward both typing speed and accuracy.
- Provide synchronized multiplayer races.
- Maintain authoritative race results on the server.
- Offer useful performance statistics and progression.
- Deliver a responsive interface with a consistent visual identity.

---

## 2. Project Highlights

| Area | Implementation |
|---|---|
| Game type | Browser-based typing racing game |
| Game rendering | Phaser 3 |
| Frontend | React 19 + TypeScript |
| Build tool | Vite |
| Backend | Node.js + Express |
| Real-time communication | Socket.IO |
| Solo mode | Independent typing practice |
| Multiplayer | Private rooms with 2–4 players |
| Room identification | Six-character room codes |
| Race synchronization | Shared passages and synchronized countdown |
| Race validation | Server-authoritative multiplayer results |
| Statistics | WPM, accuracy, race history and trends |
| Progression | Player progression and achievements |
| Visual themes | Light and dark |
| Persistence | Local browser storage and server-side JSON files |

---

## 3. Features

### 3.1 Solo Practice

Solo Practice allows players to improve their typing performance without joining a multiplayer room.

Features include:

- Interactive top-down racing circuit.
- Real-time character-by-character typing validation.
- Car movement based on typing progress.
- Incorrect-character detection.
- Error blocking until the unresolved mistake is corrected.
- Live typing speed measurement.
- Accuracy tracking.
- Race progress monitoring.
- Race completion and results summary.
- Solo race history.

The game uses Phaser 3 to render the track and vehicle movement while React handles the surrounding interface and gameplay state.

### 3.2 Private Multiplayer Racing

KeyRush supports private multiplayer races with friends.

Features include:

- Create a private racing room.
- Join using a six-character room code.
- Join using a shareable room URL.
- Support for 2–4 players.
- Host and participant roles.
- Player-ready system.
- Live lobby updates.
- Shared typing passage.
- Synchronized 3-2-1 countdown.
- Real-time player progress updates.
- Multiplayer race rankings.
- Disconnect and reconnection handling.
- Automatic host reassignment when necessary.

Example room URL:

```text
https://your-domain.com/?room=ABC123
```

The room code is automatically used to identify the intended multiplayer room.

### 3.3 Racing Track

The racing visualization is powered by Phaser 3.

The current circuit uses an irregular F1-inspired track layout rather than a simple straight road.

Track elements include:

- Top-down racing environment.
- Curved circuit geometry.
- Asphalt racing surface.
- Track boundaries.
- Red-and-white kerbs.
- Surrounding runoff areas.
- Start/finish marking.
- Multiple player vehicles.
- Vehicle positioning based on typing progress.

The track is rendered independently from the React interface through a dedicated Phaser canvas component.

### 3.4 Results Screen

After a race, players can review their performance.

The results interface includes:

- Final WPM.
- Typing accuracy.
- Race duration.
- Progress information.
- Race outcome.
- Multiplayer finishing positions.
- Performance visualization.
- Recent race information.

The WPM graph includes historical performance visualization, allowing players to observe changes in typing speed over recent races.

### 3.5 Leaderboard

KeyRush includes a leaderboard that organizes player performance.

Leaderboard information includes:

- Best WPM.
- Best accuracy.
- Races played.
- Race wins.

The leaderboard is maintained through the server-side leaderboard storage layer.

### 3.6 Statistics and Performance Tracking

The Statistics section provides a broader view of typing performance.

It includes:

- Typing-speed information.
- Accuracy statistics.
- Solo race history.
- WPM trend visualization.
- Recent race comparisons.
- Personal performance tracking.

The typing-speed graph visualizes recent solo race records and helps identify improvements or inconsistencies in typing performance.

### 3.7 Player Profile and Progression

KeyRush includes player profile and progression functionality.

Features include:

- Player profile information.
- Progression tracking.
- Achievement tracking.
- Achievement notifications.
- Personal performance information.

### 3.8 Settings

The Settings interface provides application preferences and display controls.

It includes light and dark appearance support and other available gameplay preferences.

---

## 4. How KeyRush Works

KeyRush connects typing input to vehicle movement.

The player receives a passage and must reproduce it accurately.

The application compares typed characters against the expected passage and calculates progress.

### Gameplay Flow

```text
        Open KeyRush
             |
             v
       Select Game Mode
             |
       +-----+------+
       |            |
       v            v
   Solo Practice  Multiplayer
       |            |
       |       Create / Join Room
       |            |
       |       Wait for Players
       |            |
       |       Players Ready
       |            |
       |       Host Starts Race
       |            |
       |       Synchronized
       |       Countdown
       |            |
       +-----+------+
             |
             v
       Typing Begins
             |
             v
    Character Validation
             |
       +-----+------+
       |            |
       v            v
    Correct       Incorrect
       |            |
       v            v
   Progress      Progress Blocked
   Increases     Until Corrected
       |            |
       +-----+------+
             |
             v
       Race Completion
             |
             v
       Results Screen
             |
             v
     Statistics / History
```

### Core Principle

The game does not reward typing speed alone.

Typing accuracy is essential because an unresolved typing error prevents further progress.

---

## 5. Game Modes

### Solo Practice

Solo Practice is designed for individual improvement.

The player:

1. Starts a solo race.
2. Receives a typing passage.
3. Types the passage into the race interface.
4. Moves the vehicle through accurate typing.
5. Completes the passage.
6. Reviews the results.

### Private Multiplayer

Private Multiplayer allows friends to compete in the same race.

The host creates a room and shares the room code.

Other players join the room, become ready, and wait for the host to start the race.

Once the race starts, every participant receives the same passage and synchronized countdown.

The server coordinates the race and determines the official multiplayer results.

---

## 6. Multiplayer Architecture

Multiplayer communication is implemented using Socket.IO.

The application separates responsibilities between the frontend and backend.

### Frontend Responsibilities

- Create and join rooms.
- Display room information.
- Display participant status.
- Handle ready-state interactions.
- Receive synchronized race events.
- Send player typing progress.
- Display other players' race progress.
- Display final race rankings.

### Backend Responsibilities

- Manage multiplayer rooms.
- Maintain player membership.
- Track host and participant roles.
- Manage readiness.
- Coordinate race countdown and start state.
- Synchronize multiplayer race information.
- Validate race progress and completion.
- Determine official finishing rankings.
- Handle disconnect and reconnection events.
- Persist leaderboard and statistics data.

### Multiplayer Flow

```text
 Player 1                 Server                  Player 2
    |                        |                        |
    |---- Create Room ------>|                        |
    |<--- Room Code ---------|                        |
    |                        |<----- Join Room -------|
    |                        |                        |
    |<----- Lobby Update ----|---- Lobby Update ---->|
    |                        |                        |
    |---- Ready ------------>|<------- Ready --------|
    |                        |                        |
    |---- Start Race ------->|                        |
    |                        |                        |
    |<---- Countdown --------|---- Countdown ------->|
    |                        |                        |
    |---- Typing Progress -->|<--- Typing Progress --|
    |                        |                        |
    |<---- Race Updates -----|---- Race Updates ---->|
    |                        |                        |
    |<---- Final Results ----|---- Final Results --->|
```

### Room Capacity

| Property | Value |
|---|---|
| Minimum players | 2 |
| Maximum players | 4 |
| Room code | 6 characters |
| Host | One per room |
| Race passage | Shared |
| Countdown | Synchronized |
| Reconnection grace period | 15 seconds |

### Reconnection Handling

KeyRush includes multiplayer disconnect handling.

When a participant disconnects:

- The server tracks the disconnected player.
- A reconnection grace period is provided.
- The player can reconnect using their existing player identity.
- The room state is maintained during the grace period.
- Host reassignment is handled when the host disconnects.
- Player departure is reflected in the room state.

This helps prevent temporary connection interruptions from immediately destroying an active multiplayer session.

### Server-Authoritative Results

The multiplayer server is responsible for validating official race results.

The frontend may display animations and live progress, but it is not the authority for final multiplayer rankings.

This separation helps prevent clients from independently deciding their finishing positions.

---

## 7. Typing and Race Mechanics

### Character Matching

The typing system compares user input with the expected passage.

Characters are evaluated in sequence.

Correct input advances the player's progress.

Incorrect input is identified and blocks further progress until corrected.

### Typing Speed

Typing speed is measured in Words Per Minute (WPM).

The conventional WPM calculation uses five characters as one standard word.

```text
WPM = (Correct Characters / 5) / Time in Minutes
```

### Accuracy

Accuracy represents the proportion of correctly typed characters.

```text
Accuracy = (Correct Characters / Total Characters Typed) × 100
```

The exact metrics displayed depend on the race mode and the available race data.

### Race Progress

The player's typing progress determines their position along the racing track.

Phaser renders the vehicle at the corresponding track position.

In multiplayer mode, player progress is synchronized through the backend.

---

## 8. Player Progression and Statistics

KeyRush includes multiple systems to make performance tracking useful beyond an individual race.

### Race History

Solo race history stores previous race performance information.

The history is used by the results and statistics interfaces.

### Performance Graphs

The Statistics screen visualizes recent WPM records.

The Results screen provides a performance graph for reviewing typing speed.

### Achievements

The achievement system tracks player milestones and provides achievement notifications.

### Leaderboard

The leaderboard organizes records using performance-related values, including:

- Best WPM.
- Best accuracy.
- Races played.
- Race wins.

### Player Progression

The progression system tracks player development and displays progression information through the profile interface.

---

## 9. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | React 19 | Component-based interface |
| Programming language | TypeScript | Type safety |
| Build tool | Vite 6 | Development server and production bundling |
| Game engine | Phaser 3 | Racing track and vehicle rendering |
| Icons | Lucide React | Interface icons |
| Backend runtime | Node.js | Server execution |
| Backend framework | Express 4 | HTTP server |
| Real-time communication | Socket.IO 4 | Multiplayer synchronization |
| Client communication | Socket.IO Client | Browser-to-server connection |
| TypeScript execution | tsx | Server development and execution |
| Concurrency | concurrently | Run client and server together |

### Why These Technologies?

**React**

Used to build the application interface, reusable components, screens, and player interactions.

**TypeScript**

Provides type checking and improves maintainability across frontend and backend code.

**Phaser 3**

Handles the game-specific rendering and animation, separating racing visualization from the application interface.

**Socket.IO**

Provides real-time bidirectional communication between players and the multiplayer server.

**Express**

Provides the backend HTTP server and supports production hosting of the frontend build.

**Vite**

Provides fast development and optimized frontend production builds.

---

## 10. System Architecture

KeyRush uses a client-server architecture.

```text
                  BROWSER
                     |
          +----------+----------+
          |                     |
          v                     v
     React Application     Phaser Game
          |                     |
          |              Track / Vehicles
          |                     |
          +----------+----------+
                     |
                     v
              Socket.IO Client
                     |
              WebSocket / HTTP
                     |
                     v
                Node.js Server
                     |
             Express + Socket.IO
                     |
          +----------+----------+
          |                     |
          v                     v
      Room Manager          Data Stores
          |                     |
          v               +-----+------+
    Race State            |            |
                     Leaderboard   Statistics
                       JSON          JSON
```

### Application Layers

**Presentation Layer**

React components render screens, navigation, dialogs, race information, statistics, and settings.

**Game Rendering Layer**

Phaser renders the track and vehicles.

**Communication Layer**

Socket.IO handles real-time communication between the browser and backend.

**Server Logic Layer**

The room manager maintains multiplayer room state and race coordination.

**Persistence Layer**

JSON-based stores maintain leaderboard and statistics information.

---

## 11. Project Structure

```text
Keyrush/
│
├── public/
│
├── src/
│   │
│   ├── components/
│   │   ├── AchievementNotification.tsx
│   │   ├── AchievementsPanel.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── LeaderboardScreen.tsx
│   │   ├── LobbyScreen.tsx
│   │   ├── MultiplayerModal.tsx
│   │   ├── Navbar.tsx
│   │   ├── PhaserCanvas.tsx
│   │   ├── PlayerProfileScreen.tsx
│   │   ├── PlayerProgressionBar.tsx
│   │   ├── RaceScreen.tsx
│   │   ├── ResultsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── SoloRaceHistoryPanel.tsx
│   │   └── StatisticsScreen.tsx
│   │
│   ├── data/
│   │   └── passages.ts
│   │
│   ├── game/
│   │   └── PhaserTrackScene.ts
│   │
│   ├── services/
│   │   ├── socketService.ts
│   │   └── soundService.ts
│   │
│   ├── types/
│   │   └── game.ts
│   │
│   ├── utils/
│   │   ├── achievements.ts
│   │   ├── playerProfile.ts
│   │   ├── progression.ts
│   │   ├── raceHistory.ts
│   │   └── typingMath.ts
│   │
│   ├── vendor/
│   │   └── engine-sim/
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── server/
│   ├── index.ts
│   ├── roomManager.ts
│   ├── leaderboardStore.ts
│   ├── statisticsStore.ts
│   ├── types.ts
│   ├── leaderboard.json
│   ├── statistics.json
│   └── .env.example
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.server.json
└── vite.config.ts
```

### Important Files

| File | Responsibility |
|---|---|
| `src/App.tsx` | Main application state and screen coordination |
| `src/components/HomeScreen.tsx` | Main home interface |
| `src/components/RaceScreen.tsx` | Race interface and typing interactions |
| `src/components/PhaserCanvas.tsx` | Phaser canvas integration |
| `src/game/PhaserTrackScene.ts` | Track rendering and vehicle movement |
| `src/services/socketService.ts` | Socket.IO client communication |
| `src/services/soundService.ts` | Sound-related functionality |
| `src/utils/typingMath.ts` | Typing metric calculations |
| `src/utils/raceHistory.ts` | Solo race history utilities |
| `src/utils/achievements.ts` | Achievement logic |
| `src/utils/progression.ts` | Player progression logic |
| `server/index.ts` | Backend entry point |
| `server/roomManager.ts` | Room and multiplayer race management |
| `server/leaderboardStore.ts` | Leaderboard persistence |
| `server/statisticsStore.ts` | Statistics persistence |

---

## 12. Data Storage

KeyRush currently uses lightweight storage mechanisms rather than a relational database.

### Server-Side JSON Storage

The backend includes two JSON data files:

**`server/leaderboard.json`**

Stores leaderboard records.

The leaderboard data model includes fields such as:

```json
[
  {
    "name": "Player",
    "bestWpm": 75,
    "bestAccuracy": 98,
    "racesPlayed": 12,
    "raceWins": 5
  }
]
```

The example above illustrates the data structure, not live production records.

**`server/statistics.json`**

Stores server-side statistics records.

### Browser-Side Storage

Browser-side utilities support player profile, progression, achievements, and solo race history.

These mechanisms allow the application to maintain player-related information without requiring a database server.

### Current Storage Considerations

JSON persistence is suitable for a small prototype and single-server deployment.

For a larger public multiplayer service, a database-backed architecture would be more appropriate.

Potential future options include PostgreSQL or another persistent database with a dedicated data-access layer.

---

## 13. Environment Variables

KeyRush uses separate environment configuration for the frontend and backend.

### Frontend Environment

File:

```text
.env
```

Example:

```env
VITE_SERVER_URL=http://localhost:3001
```

| Variable | Description |
|---|---|
| `VITE_SERVER_URL` | Backend URL used by the frontend Socket.IO client |

The example value points to the local development server.

### Backend Environment

File:

```text
server/.env
```

Example:

```env
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

| Variable | Description |
|---|---|
| `PORT` | Port used by the backend server |
| `ALLOWED_ORIGINS` | Allowed browser origins for CORS |

### Creating Environment Files

Copy the example files:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

Do not commit actual environment files containing private configuration.

The repository includes example environment files for local setup.

---

## 14. Installation and Local Setup

### Prerequisites

Install the following:

- Node.js
- npm
- Git
- A modern web browser

Check the installations:

```bash
node -v
npm -v
git --version
```

### Clone the Repository

```bash
git clone https://github.com/tejass23106/KeyRush.git
```

Navigate into the project:

```bash
cd KeyRush
```

### Install Dependencies

```bash
npm install
```

This installs the frontend and backend dependencies defined in the root `package.json`.

### Configure Environment

Create the local environment files:

```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

### Start Development

```bash
npm run dev
```

This starts the frontend and backend together.

---

## 15. Running the Application

The project provides the following npm scripts.

| Command | Purpose |
|---|---|
| `npm run dev` | Starts frontend and backend together |
| `npm run dev:client` | Starts the Vite frontend |
| `npm run dev:server` | Starts the backend in watch mode |
| `npm run build` | Type-checks and builds the frontend |
| `npm run build:client` | Builds the frontend |
| `npm run start:server` | Starts the backend server |
| `npm run preview` | Previews the production frontend build |

### Development URLs

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:3001` |
| Health check | `http://localhost:3001/health` |

### Run Services Separately

If you want to run the frontend and backend in separate terminals:

**Terminal 1 — Backend**

```bash
npm run dev:server
```

**Terminal 2 — Frontend**

```bash
npm run dev:client
```

---

## 16. Testing Multiplayer Locally

You can test a multiplayer race using two browser windows.

### Step 1 — Start the Application

```bash
npm run dev
```

### Step 2 — Create a Room

1. Open `http://localhost:5173`.
2. Select Play with Friends.
3. Create a room.
4. Copy the generated room code.

### Step 3 — Join from Another Browser

1. Open an Incognito window or another browser.
2. Visit `http://localhost:5173`.
3. Select Play with Friends.
4. Choose Join Room.
5. Enter the room code.

### Step 4 — Prepare Players

1. Verify that both players appear in the lobby.
2. Have the joining player mark themselves ready.
3. Confirm that the host can start the race.

### Step 5 — Race

1. Host starts the race.
2. Both clients receive the synchronized countdown.
3. Both players type the same passage.
4. Verify that vehicle progress updates.
5. Complete the race and inspect the results.

### Additional Multiplayer Tests

- Join using a room URL.
- Test the maximum four-player room capacity.
- Disconnect and reconnect a participant.
- Disconnect the host and verify reassignment.
- Verify that final rankings are determined by the server.
- Verify that room updates appear consistently across clients.

---

## 17. Production Build

To generate a production frontend build:

```bash
npm run build
```

The build process runs TypeScript checking and Vite production bundling.

Generated frontend assets are placed in:

```text
dist/
```

The backend is executed using `tsx` through the configured start script.

Start the backend:

```bash
npm run start:server
```

### Production Architecture

The current backend is configured to serve the compiled frontend assets as well as handle backend and Socket.IO requests.

```text
             Browser
                |
                v
        Express Server
                |
       +--------+--------+
       |                 |
       v                 v
   Static Assets     Socket.IO
       |                 |
       v                 v
    React App       Multiplayer Logic
```

This allows the frontend and backend to be hosted together.

---

## 18. Deployment

The application can be deployed on a Node.js-compatible hosting platform.

Examples include Render, Railway, and Fly.io.

### General Deployment Steps

1. Push the project to GitHub.
2. Create a web service on your chosen hosting provider.
3. Connect the GitHub repository.
4. Configure the build command.
5. Configure the server start command.
6. Set the production environment variables.
7. Deploy and test the application.

### Build Command

```bash
npm install && npm run build
```

### Start Command

```bash
npm run start:server
```

### Production Environment Variables

Configure the following values on the hosting platform:

```env
PORT=10000
ALLOWED_ORIGINS=https://your-production-domain.com
NODE_ENV=production
```

The hosting platform may provide the `PORT` value automatically.

### Frontend Backend URL

When the Express server serves the frontend and Socket.IO from the same origin, the frontend can use the same-origin connection configuration.

If the frontend and backend are deployed separately, configure `VITE_SERVER_URL` to point to the deployed backend before building the frontend.

### Deployment Verification

After deployment, verify:

- Frontend loads correctly.
- Backend health endpoint responds.
- Socket.IO connection succeeds.
- Room creation works.
- Room joining works.
- Multiplayer countdown is synchronized.
- Race progress updates correctly.
- Final rankings are correct.
- Static assets load successfully.

**Important:** JSON file persistence and in-memory room state have deployment implications. Confirm that the hosting environment provides persistent storage for the JSON files if leaderboard and statistics data must survive restarts. A multi-instance deployment would require shared persistence and coordinated room state.

---

## 19. Security and Reliability

KeyRush uses a client-server architecture for multiplayer gameplay.

Important reliability considerations include:

### Server-Side Validation

Official multiplayer race completion and rankings are handled by the backend.

### Room Management

The room manager maintains room membership, host information, player readiness, and race state.

### Reconnection

A disconnected player receives a 15-second reconnection grace period.

### CORS Configuration

The backend uses the `ALLOWED_ORIGINS` environment variable to configure allowed origins.

### Environment Configuration

Environment files are excluded from Git through `.gitignore`.

### Production Considerations

Before opening the application to unrestricted public traffic, review:

- Socket.IO event validation.
- Room creation and joining rate limits.
- Player identity and reconnect-token handling.
- Input validation.
- Room lifecycle and cleanup.
- Server resource limits.
- Persistent storage reliability.
- Logging and monitoring.
- Deployment CORS configuration.

---

## 20. Responsive Design

KeyRush includes responsive layouts for different screen sizes.

The interface has been tested across:

- Desktop layouts.
- Tablet-sized layouts.
- Mobile layouts.
- Narrow mobile viewports.

The application also supports light and dark themes.

Responsive implementation covers the major application areas, including:

- Home screen.
- Multiplayer lobby.
- Race screen.
- Typing passage workspace.
- Results screen.
- Statistics.
- Settings.

The race interface is designed to preserve access to typing input and essential race information across smaller viewports.

---

## 21. Troubleshooting

### Port Already in Use

If the frontend or backend port is already occupied, stop the conflicting process or configure an available port.

### Socket.IO Connection Failure

Check:

1. Backend server is running.
2. `VITE_SERVER_URL` points to the correct backend.
3. Backend CORS configuration includes the frontend origin.
4. No firewall or proxy is blocking the connection.

### Multiplayer Room Cannot Be Joined

Check:

- Room code is correct.
- Room has not expired or finished.
- Room has not reached capacity.
- Backend is running.
- Socket.IO connection is established.

### Environment Variables Not Updating

Restart the Vite development server after changing frontend environment variables.

### Build Errors

Run:

```bash
npm install
npm run build
```

Review TypeScript errors and dependency installation output.

### Leaderboard or Statistics Not Persisting

Check:

- Server has write access to its storage directory.
- JSON files are valid.
- Hosting storage is persistent.
- The server is not running in an ephemeral filesystem environment.

---

## 22. Current Scope and Limitations

KeyRush is a working browser-based typing-racing application with solo and private multiplayer functionality.

The current architecture uses:

- React and Phaser on the client.
- Node.js and Socket.IO on the backend.
- JSON-based server persistence for leaderboard and statistics.
- Browser-side utilities for player-related data.

The current project does not use a relational database or a full account-authentication system.

### Important Architecture Boundaries

| Area | Current approach |
|---|---|
| Multiplayer rooms | Server-managed room state |
| Race synchronization | Socket.IO |
| Official multiplayer results | Backend validation |
| Leaderboard persistence | JSON file |
| Statistics persistence | JSON file |
| Solo race history | Browser-side storage utility |
| Player progression | Browser-side utility |
| Authentication | No full account-authentication system |
| Database | No relational database currently configured |

These boundaries should be considered before scaling the application to a large public user base.

---

## 23. Future Improvements

Potential areas for future development include:

### Multiplayer

- Public matchmaking.
- Larger racing competitions.
- Spectator support.
- More robust room lifecycle management.

### Persistence

- Database-backed player accounts.
- Cloud-synchronized race history.
- Persistent profiles across devices.
- Centralized statistics storage.

### Gameplay

- Additional racing circuits.
- More vehicle customization.
- Improved sound design.
- Additional race modes.
- Computer-controlled opponents.

### Analytics

- More detailed typing performance analytics.
- Long-term WPM and accuracy trends.
- Personal records.
- Comparative performance reports.

### Infrastructure

- Automated testing.
- Production monitoring.
- Rate limiting and abuse protection.
- Scalable real-time infrastructure.

These are potential improvements, not claims about currently implemented functionality.

---

## 24. Git Workflow

### Clone

```bash
git clone https://github.com/tejass23106/KeyRush.git
cd KeyRush
```

### Check Changes

```bash
git status
```

### Stage Changes

```bash
git add .
```

### Commit

```bash
git commit -m "Describe your changes"
```

### Push

```bash
git push origin main
```

### Pull Latest Changes

```bash
git pull origin main
```

Avoid rewriting shared Git history unless there is a specific reason to do so.

---

## 25. Author

**Tejas Kumar S**

Computer Science and Engineering Student

- GitHub: [@tejass23106](https://github.com/tejass23106)
- Project Repository: [KeyRush](https://github.com/tejass23106/KeyRush)

---

<p align="center">
  <strong>KeyRush</strong>
  <br />
  Type Fast. Drive Faster. Race to the Finish.
</p>