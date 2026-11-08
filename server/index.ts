import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { RoomManager } from './roomManager';
import { LeaderboardStore } from './leaderboardStore';
import { StatisticsStore } from './statisticsStore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Configure CORS allowed origins from env variable or default to wildcard / local origins
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
let corsOrigins: string | string[] = '*';

if (allowedOriginsEnv && allowedOriginsEnv !== '*') {
  corsOrigins = allowedOriginsEnv.split(',').map((origin) => origin.trim());
}

app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST'],
  })
);
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

const roomManager = new RoomManager();
roomManager.setRoomUpdateCallback((room, playerName) => {
  io.to(room.code).emit('room_updated', room);

  io.to(room.code).emit('player_left', {
    playerName,
    remainingPlayerCount: room.players.length,
  });
});
const leaderboardStore = new LeaderboardStore();
const statisticsStore = new StatisticsStore();

// Health Check Endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    activeRooms: roomManager.getActiveRoomsCount(),
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});
// Leaderboard API
app.get('/api/leaderboard', (_req, res) => {
  res.json(leaderboardStore.getLeaderboard());
});
// Multiplayer Statistics API
app.get('/api/statistics', (req, res) => {
  const name = req.query.name;

  if (typeof name !== 'string' || !name.trim()) {
    res.status(400).json({
      error: 'A valid player name is required.',
    });
    return;
  }

  res.json(statisticsStore.getPlayerHistory(name));
});
// Socket.IO Connection Handlers
io.on('connection', (socket: Socket) => {
  // 1. Create Room
  socket.on('create_room', ({ name }: { name: string }, callback) => {
    try {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        if (callback) callback({ ok: false, error: 'Valid display name is required.' });
        return;
      }
      const { room, player } = roomManager.createRoom(socket.id, name);
      socket.join(room.code);
      if (callback) callback({ ok: true, roomCode: room.code, room, playerId: player.id });
      io.to(room.code).emit('room_updated', room);
    } catch (err: any) {
      if (callback) callback({ ok: false, error: err.message || 'Failed to create room.' });
    }
  });

  // 2. Join Room
  socket.on(
    'join_room',
    ({ roomCode, name, playerId }: { roomCode: string; name: string; playerId?: string }, callback) => {
      if (!roomCode || typeof roomCode !== 'string') {
        if (callback) callback({ ok: false, error: 'Valid room code is required.' });
        return;
      }

      const result = roomManager.joinRoom(socket.id, roomCode, name, playerId);
      if (!result.ok || !result.room) {
        if (callback) callback({ ok: false, error: result.error });
        return;
      }

      socket.join(result.room.code);
      if (callback) callback({ ok: true, room: result.room, playerId: result.player?.id });
      io.to(result.room.code).emit('room_updated', result.room);
    }
  );

  // 3. Toggle Ready Status
  socket.on('toggle_ready', () => {
    const { room, error } = roomManager.toggleReady(socket.id);
    if (error) {
      socket.emit('error_message', error);
      return;
    }
    if (room) {
      io.to(room.code).emit('room_updated', room);
    }
  });

  // 4. Host Start Race
  socket.on('start_race', () => {
    const { ok, room, error } = roomManager.startRacePrecheck(socket.id);
    if (!ok || !room) {
      socket.emit('error_message', error || 'Cannot start race.');
      return;
    }

    io.to(room.code).emit('room_updated', room);

    let countdown = 3;
    io.to(room.code).emit('race_countdown', countdown);

    const countdownInterval = setInterval(() => {
      countdown -= 1;
      if (countdown > 0) {
        io.to(room.code).emit('race_countdown', countdown);
      } else {
        clearInterval(countdownInterval);
        room.state = 'RACING';
        room.startTimeMs = Date.now();
        io.to(room.code).emit('race_started', {
          passage: room.passage,
          startTimeMs: room.startTimeMs,
        });
        io.to(room.code).emit('room_updated', room);
      }
    }, 1000);
  });
  // Server-authoritative typing action
  socket.on('typing_action', (key: string) => {
    const { room, player } = roomManager.processTypingAction(
      socket.id,
      key
    );

    if (room && player) {
      io.to(room.code).emit('player_progress_updated', {
        playerId: player.id,
        progressRatio: player.progressRatio,
        wpm: player.wpm,
        accuracy: player.accuracy,
      });
    }
  });

  // 5. Typing Progress Update
  socket.on(
    'update_progress',
    ({ progressRatio, wpm, accuracy }: { progressRatio: number; wpm: number; accuracy: number }) => {
      const { room, player } = roomManager.updatePlayerProgress(
        socket.id,
        progressRatio,
        wpm,
        accuracy
      );

      if (room && player) {
        io.to(room.code).emit('player_progress_updated', {
          playerId: player.id,
          progressRatio: player.progressRatio,
          wpm: player.wpm,
          accuracy: player.accuracy,
        });
      }
    }
  );

  // Finish Race — server validates completion and calculates results.
  socket.on('finish_race', () => {
    const { room, player, isRaceComplete } =
      roomManager.playerFinished(socket.id);

    if (room && player) {
      io.to(room.code).emit('player_finished', {
        playerId: player.id,
        rank: player.finishRank,
        finishTimeSeconds: player.finishTimeSeconds,
        wpm: player.wpm,
        accuracy: player.accuracy,
      });

      io.to(room.code).emit('room_updated', room);

      if (isRaceComplete) {
        leaderboardStore.recordRace(room.players);
        statisticsStore.recordRace(room);
        io.to(room.code).emit('race_finished', { room });
      }
    }
  });


  // 7. Reset Room for Play Again
  socket.on('play_again', () => {
    const { ok, room, error } = roomManager.resetRoomToLobby(socket.id);
    if (!ok || !room) {
      socket.emit('error_message', error || 'Cannot reset race.');
      return;
    }
    io.to(room.code).emit('room_updated', room);
  });

  // 8. Leave Room
  socket.on('leave_room', () => {
    const { room, playerName } = roomManager.leaveRoom(socket.id);

    if (room && playerName) {
      // Update the remaining players first.
      socket.to(room.code).emit('room_updated', room);

      // Notify only the other players.
      socket.to(room.code).emit('player_left', {
        playerName,
        remainingPlayerCount: room.players.length,
      });
    }

    // Remove the leaving socket from the room.
    if (room) {
      socket.leave(room.code);
    }
  });

  // 9. Disconnect Handling
  socket.on('disconnect', () => {
    const { room } = roomManager.handleDisconnect(socket.id);
    if (room) {
      io.to(room.code).emit('room_updated', room);
    }
  });
});

// Production Static Asset Serving & SPA Fallback
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`KeyRush Backend Server listening on port ${PORT}`);
});

// Graceful Shutdown Signal Handling
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down KeyRush server gracefully...`);
  httpServer.close(() => {
    console.log('HTTP and WebSocket server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
