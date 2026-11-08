import { Room, Player, CAR_COLORS } from '../src/types/game';
import { PASSAGES } from '../src/data/passages';
interface PlayerTypingState {
  typedText: string;
  totalAttempts: number;
  mistakeCount: number;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToPlayer: Map<string, { roomCode: string; playerId: string }> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private typingStates: Map<string, PlayerTypingState> = new Map();

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private roomUpdateCallback?: (
    room: Room,
    playerName: string
  ) => void;

  public setRoomUpdateCallback(
    callback: (room: Room, playerName: string) => void
  ) {
    this.roomUpdateCallback = callback;
  }

  public getActiveRoomsCount(): number {
    return this.rooms.size;
  }


  public getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  public createRoom(socketId: string, playerName: string): { room: Room; player: Player } {
    let code = this.generateRoomCode();
    while (this.rooms.has(code)) {
      code = this.generateRoomCode();
    }


    const playerId = socketId;
    const player: Player = {
      id: playerId,
      name: playerName.trim() || 'Host Racer',
      isHost: true,
      isReady: true,
      lane: 0,
      progressRatio: 0,
      wpm: 0,
      accuracy: 100,
      wpmHistory: [],

      isFinished: false,
      isConnected: true,
      colorHex: CAR_COLORS[0],
    };

    const room: Room = {
      code,
      hostId: playerId,
      state: 'WAITING',
      passage: PASSAGES[0],
      players: [player],
      countdownSeconds: 3,
      maxPlayers: 4,
    };

    this.rooms.set(code, room);
    this.socketToPlayer.set(socketId, { roomCode: code, playerId });

    return { room, player };
  }

  public joinRoom(
    socketId: string,
    roomCode: string,
    playerName: string,
    existingPlayerId?: string
  ): { ok: boolean; room?: Room; player?: Player; error?: string } {
    const formattedCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(formattedCode);

    if (!room) {
      return { ok: false, error: 'Room code not found.' };
    }

    // 1. Authoritative check: Check if player already exists in room participants list
    const existingPlayer = room.players.find(
      (p: Player) => p.id === socketId || (existingPlayerId && p.id === existingPlayerId)
    );

    if (existingPlayer) {
      // Preserve the original player ID across reconnections.
      const stablePlayerId = existingPlayer.id;

      // Clear the original player's pending disconnect timer.
      const timerKey = `${room.code}:${stablePlayerId}`;

      if (this.disconnectTimers.has(timerKey)) {
        clearTimeout(this.disconnectTimers.get(timerKey)!);
        this.disconnectTimers.delete(timerKey);
      }

      // Remove stale socket mappings for this player.
      for (const [oldSocketId, mapping] of this.socketToPlayer.entries()) {
        if (
          mapping.roomCode === formattedCode &&
          mapping.playerId === stablePlayerId &&
          oldSocketId !== socketId
        ) {
          this.socketToPlayer.delete(oldSocketId);
        }
      }

      // Restore the existing player without creating a duplicate.
      existingPlayer.isConnected = true;

      if (playerName.trim()) {
        existingPlayer.name = playerName.trim();
      }

      // Map the new socket to the original player identity.
      this.socketToPlayer.set(socketId, {
        roomCode: formattedCode,
        playerId: stablePlayerId,
      });

      return { ok: true, room, player: existingPlayer };
    }

    // 2. Reject join if race is already in progress
    if (room.state !== 'WAITING') {
      return { ok: false, error: 'Race is already in progress.' };
    }

    // 3. Reject join if room capacity (4 unique participants) is reached
    if (room.players.length >= room.maxPlayers) {
      return { ok: false, error: 'Room is full (max 4 players).' };
    }

    // 4. Assign available lane
    const usedLanes = new Set(room.players.map((p: Player) => p.lane));
    let assignedLane = 0;
    for (let l = 0; l < room.maxPlayers; l++) {
      if (!usedLanes.has(l)) {
        assignedLane = l;
        break;
      }
    }

    const playerId = socketId;
    const player: Player = {
      id: playerId,
      name: playerName.trim() || `Racer ${room.players.length + 1}`,
      isHost: false,
      isReady: false,
      lane: assignedLane,
      progressRatio: 0,
      wpm: 0,
      accuracy: 100,
      wpmHistory: [],
      isFinished: false,
      isConnected: true,
      colorHex: CAR_COLORS[assignedLane % CAR_COLORS.length],
    };

    room.players.push(player);

    // If the room has no connected host, promote this player.
    const hasConnectedHost = room.players.some(
      (p: Player) => p.isHost && p.isConnected
    );

    if (!hasConnectedHost) {
      player.isHost = true;
      player.isReady = true;
      room.hostId = player.id;
    }

    this.socketToPlayer.set(socketId, {
      roomCode: formattedCode,
      playerId,
    });

    return { ok: true, room, player };
  }

  public toggleReady(socketId: string): { room?: Room; player?: Player; error?: string } {
    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return { error: 'Not in a room.' };

    const room = this.rooms.get(mapping.roomCode);
    if (!room) return { error: 'Room not found.' };

    const player = room.players.find((p: Player) => p.id === mapping.playerId);
    if (!player) return { error: 'Player not found.' };

    if (room.state !== 'WAITING') {
      return { error: 'Cannot change ready state during race.' };
    }

    if (!player.isHost) {
      player.isReady = !player.isReady;
    }

    return { room, player };
  }

  public startRacePrecheck(socketId: string): { ok: boolean; room?: Room; error?: string } {
    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return { ok: false, error: 'Not in a room.' };

    const room = this.rooms.get(mapping.roomCode);
    if (!room) return { ok: false, error: 'Room not found.' };

    const requestingPlayer = room.players.find(
      (p: Player) => p.id === mapping.playerId
    );

    if (
      !requestingPlayer ||
      !requestingPlayer.isConnected ||
      !requestingPlayer.isHost ||
      room.hostId !== mapping.playerId
    ) {
      return { ok: false, error: 'Only the connected room host can start the race.' };
    }

    if (room.state !== 'WAITING') {
      return { ok: false, error: 'Race already started.' };
    }

    const connectedPlayers = room.players.filter((p: Player) => p.isConnected);
    if (connectedPlayers.length < 2) {
      return { ok: false, error: 'At least 2 players are required to start a race.' };
    }

    const allReady = connectedPlayers.every((p: Player) => p.isReady || p.isHost);
    if (!allReady) {
      return { ok: false, error: 'All connected players must be Ready before starting.' };
    }

    const passage = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    room.passage = passage;
    room.state = 'COUNTDOWN';
    room.countdownSeconds = 3;

    room.players.forEach((p: Player) => {
      p.progressRatio = 0;
      p.wpm = 0;
      p.accuracy = 100;
      p.wpmHistory = [];
      p.isFinished = false;
      p.finishRank = undefined;
      p.finishTimeSeconds = undefined;

      this.typingStates.set(`${room.code}:${p.id}`, {
        typedText: '',
        totalAttempts: 0,
        mistakeCount: 0,
      });
    });

    return { ok: true, room };
  }
  public processTypingAction(
    socketId: string,
    key: string
  ): { room?: Room; player?: Player } {
    if (
      typeof key !== 'string' ||
      (key.length !== 1 &&
        key !== 'Backspace' &&
        key !== 'Delete')
    ) {
      return {};
    }
    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return {};

    const room = this.rooms.get(mapping.roomCode);
    if (!room || room.state !== 'RACING') return {};

    const player = room.players.find(
      (p: Player) => p.id === mapping.playerId
    );

    if (!player || !player.isConnected || player.isFinished) {
      return {};
    }

    const stateKey = `${room.code}:${player.id}`;
    const typingState = this.typingStates.get(stateKey);

    if (!typingState) return {};

    const passageText = room.passage.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (key === 'Backspace' || key === 'Delete') {
      typingState.typedText = typingState.typedText.slice(0, -1);
    } else if (key.length === 1) {
      if (typingState.typedText.length >= passageText.length) {
        return {};
      }

      typingState.totalAttempts++;

      let matchedCount = 0;

      for (
        let i = 0;
        i < Math.min(passageText.length, typingState.typedText.length);
        i++
      ) {
        if (typingState.typedText[i] !== passageText[i]) break;
        matchedCount++;
      }

      const hasError = typingState.typedText.length > matchedCount;
      const currentPos = typingState.typedText.length;

      const isCorrect =
        currentPos < passageText.length &&
        key === passageText[currentPos] &&
        !hasError;

      if (!isCorrect) {
        typingState.mistakeCount++;
      }

      typingState.typedText += key;
    } else {
      return {};
    }

    let matchedCount = 0;

    for (
      let i = 0;
      i < Math.min(passageText.length, typingState.typedText.length);
      i++
    ) {
      if (typingState.typedText[i] !== passageText[i]) break;
      matchedCount++;
    }

    const elapsedSeconds = room.startTimeMs
      ? (Date.now() - room.startTimeMs) / 1000
      : 0;

    player.progressRatio =
      passageText.length > 0
        ? matchedCount / passageText.length
        : 0;

    player.wpm =
      elapsedSeconds < 2 || matchedCount <= 0
        ? 0
        : Math.round(
          (matchedCount / 5) * (60 / elapsedSeconds) * 10
        ) / 10;

    player.accuracy =
      passageText.length > 0
        ? Math.round(
          (Math.max(0, passageText.length - typingState.mistakeCount) /
            passageText.length) *
          1000
        ) / 10
        : 100;

    const elapsedWholeSeconds = Math.floor(elapsedSeconds);
    const history = player.wpmHistory ?? [];
    const lastSample = history[history.length - 1];

    if (!lastSample || elapsedWholeSeconds > lastSample.timeSeconds) {
      player.wpmHistory = [
        ...history,
        {
          timeSeconds: elapsedWholeSeconds,
          wpm: player.wpm,
        },
      ].slice(-600);
    }

    return { room, player };
  }



  public playerFinished(
    socketId: string
  ): { room?: Room; player?: Player; isRaceComplete?: boolean } {
    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return {};

    const room = this.rooms.get(mapping.roomCode);

    // Ignore finish events after the race has ended.
    if (!room || room.state !== 'RACING') return {};

    const player = room.players.find(
      (p: Player) => p.id === mapping.playerId
    );

    if (!player || !player.isConnected || player.isFinished) {
      return {};
    }

    const stateKey = `${room.code}:${player.id}`;
    const typingState = this.typingStates.get(stateKey);

    if (!typingState || room.startTimeMs == null) {
      return {};
    }

    const passageText = room.passage.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // The server accepts completion only when the entire passage matches.
    if (typingState.typedText !== passageText) {
      return {};
    }

    // Calculate final statistics using server-side data.
    const elapsedSeconds =
      (Date.now() - room.startTimeMs) / 1000;

    player.isFinished = true;
    player.progressRatio = 1;

    player.wpm =
      elapsedSeconds < 2 || passageText.length <= 0
        ? 0
        : Math.round(
          (passageText.length / 5) *
          (60 / elapsedSeconds) *
          10
        ) / 10;

    player.accuracy =
      passageText.length > 0
        ? Math.round(
          (Math.max(
            0,
            passageText.length - typingState.mistakeCount
          ) /
            passageText.length) *
          1000
        ) / 10
        : 100;

    player.finishTimeSeconds =
      Math.round(elapsedSeconds * 10) / 10;

    // Capture the final WPM for the graph.
    const history = player.wpmHistory ?? [];

    const finalSample = {
      timeSeconds: player.finishTimeSeconds,
      wpm: player.wpm,
    };

    const lastSample = history[history.length - 1];

    if (
      lastSample &&
      finalSample.timeSeconds <= lastSample.timeSeconds
    ) {
      history[history.length - 1] = finalSample;
    } else {
      history.push(finalSample);
    }

    player.wpmHistory = history.slice(-600);

    // End the race immediately when the first player finishes.
    room.state = 'FINISHED';

    // Rank the winner first, then order unfinished players by progress.
    const standings = [...room.players].sort((a, b) => {
      if (a.isFinished !== b.isFinished) {
        return a.isFinished ? -1 : 1;
      }

      if (a.isFinished && b.isFinished) {
        return (
          (a.finishTimeSeconds ?? Infinity) -
          (b.finishTimeSeconds ?? Infinity)
        );
      }

      const progressDifference =
        b.progressRatio - a.progressRatio;

      if (progressDifference !== 0) {
        return progressDifference;
      }

      return b.wpm - a.wpm;
    });

    standings.forEach((standingPlayer, index) => {
      standingPlayer.finishRank = index + 1;
    });

    return {
      room,
      player,
      isRaceComplete: true,
    };
  }

  public resetRoomToLobby(socketId: string): { ok: boolean; room?: Room; error?: string } {
    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return { ok: false, error: 'Not in a room.' };

    const room = this.rooms.get(mapping.roomCode);
    if (!room) return { ok: false, error: 'Room not found.' };

    room.state = 'WAITING';
    room.players.forEach((p: Player) => {
      p.progressRatio = 0;
      p.wpm = 0;
      p.accuracy = 100;
      p.wpmHistory = [];
      p.isFinished = false;
      p.finishRank = undefined;
      p.finishTimeSeconds = undefined;
      if (!p.isHost) {
        p.isReady = false;
      }
    });

    return { ok: true, room };
  }

  public handleDisconnect(socketId: string): { room?: Room; player?: Player } {
    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return {};

    const room = this.rooms.get(mapping.roomCode);
    if (!room) return {};

    const player = room.players.find((p: Player) => p.id === mapping.playerId);
    if (!player) return {};

    // Remove this socket mapping immediately.
    this.socketToPlayer.delete(socketId);

    player.isConnected = false;

    if (player.isHost) {
      const nextHost = room.players.find(
        (p: Player) => p.isConnected && p.id !== player.id
      );

      if (nextHost) {
        player.isHost = false;
        nextHost.isHost = true;
        nextHost.isReady = true;
        room.hostId = nextHost.id;
      }
    }

    const timerKey = `${room.code}:${player.id}`;

    // Clear any previous disconnect timer.
    if (this.disconnectTimers.has(timerKey)) {
      clearTimeout(this.disconnectTimers.get(timerKey)!);
    }

    const timer = setTimeout(() => {
      // Only remove the player if they are still disconnected.
      const currentRoom = this.rooms.get(room.code);

      if (!currentRoom) {
        this.disconnectTimers.delete(timerKey);
        return;
      }

      const currentPlayer = currentRoom.players.find(
        (p: Player) => p.id === player.id
      );

      if (currentPlayer && !currentPlayer.isConnected) {
        const disconnectedPlayerName = currentPlayer.name;

        const updatedRoom = this.removePlayer(room.code, player.id);

        if (updatedRoom) {
          this.roomUpdateCallback?.(
            updatedRoom,
            disconnectedPlayerName
          );
        }
      }

      this.disconnectTimers.delete(timerKey);
    }, 15000);

    this.disconnectTimers.set(timerKey, timer);

    return { room, player };
  }

  private removePlayer(roomCode: string, playerId: string): Room | undefined {
    const room = this.rooms.get(roomCode);
    if (!room) return undefined;

    room.players = room.players.filter(
      (p: Player) => p.id !== playerId
    );

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      return undefined;
    }

    return room;
  }

  public leaveRoom(
    socketId: string
  ): { room?: Room; playerName?: string } {
    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return {};

    const room = this.rooms.get(mapping.roomCode);

    this.socketToPlayer.delete(socketId);

    if (!room) return {};

    // Capture the player's name before removing them.
    const leavingPlayer = room.players.find(
      (p: Player) => p.id === mapping.playerId
    );

    if (!leavingPlayer) return { room };

    const playerName = leavingPlayer.name;

    // Clear any pending reconnection timer.
    const timerKey = `${room.code}:${mapping.playerId}`;

    if (this.disconnectTimers.has(timerKey)) {
      clearTimeout(this.disconnectTimers.get(timerKey)!);
      this.disconnectTimers.delete(timerKey);
    }

    // Remove the player from active participants and standings.
    room.players = room.players.filter(
      (p: Player) => p.id !== mapping.playerId
    );

    // Delete the room if nobody remains.
    if (room.players.length === 0) {
      this.rooms.delete(mapping.roomCode);
      return { playerName };
    }

    // Reassign host if the departing player was host.
    if (room.hostId === mapping.playerId) {
      const newHost =
        room.players.find((p: Player) => p.isConnected) ||
        room.players[0];

      if (newHost) {
        newHost.isHost = true;
        newHost.isReady = true;
        room.hostId = newHost.id;
      }
    }

    // Keep the current race state unchanged.
    return { room, playerName };
  }
}
