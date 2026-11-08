import { io, Socket } from 'socket.io-client';
import { Room, Passage } from '../types/game';
interface MultiplayerSession {
  roomCode: string;
  playerId: string;
  playerName: string;
}

const SESSION_KEY = 'keyrush:multiplayer-session';

// Configure server URL via Vite env variable with fallback for local dev
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:3001');

class SocketService {
  private socket: Socket | null = null;
  private onSessionRestoredCallback?: (data: {
    room: Room;
    playerId: string;
  }) => void;
  public onSessionRestored(
    callback: (data: { room: Room; playerId: string }) => void
  ) {
    this.onSessionRestoredCallback = callback;
  }
  private saveSession(session: MultiplayerSession) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private getSession(): MultiplayerSession | null {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);

      if (!saved) return null;

      const session = JSON.parse(saved) as MultiplayerSession;

      if (!session.roomCode || !session.playerId || !session.playerName) {
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  private clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }
  public onPlayerLeft(
    callback: (data: {
      playerName: string;
      remainingPlayerCount: number;
    }) => void
  ) {
    this.socket?.on('player_left', callback);
  }

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(SERVER_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        const session = this.getSession();

        if (!session) return;

        this.socket?.emit(
          'join_room',
          {
            roomCode: session.roomCode,
            name: session.playerName,
            playerId: session.playerId,
          },
          (res: any) => {
            if (res?.ok && res.room && res.playerId) {
              this.saveSession({
                roomCode: res.room.code,
                playerId: res.playerId,
                playerName: session.playerName,
              });

              this.onSessionRestoredCallback?.({
                room: res.room,
                playerId: res.playerId,
              });
            } else {
              this.clearSession();
            }
          }
        );
      });
    }

    return this.socket;
  }
  public getSocketId(): string | null {
    return this.socket?.id || null;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public createRoom(name: string): Promise<{ ok: boolean; roomCode?: string; room?: Room; playerId?: string; error?: string }> {
    return new Promise((resolve) => {
      const socket = this.connect();
      socket.emit('create_room', { name }, (res: any) => {
        if (res.ok && res.room && res.playerId) {
          this.saveSession({
            roomCode: res.room.code,
            playerId: res.playerId,
            playerName: name,
          });
        }

        resolve(res);
      });
    });
  }

  public joinRoom(roomCode: string, name: string, playerId?: string): Promise<{ ok: boolean; room?: Room; playerId?: string; error?: string }> {
    return new Promise((resolve) => {
      const socket = this.connect();
      socket.emit('join_room', { roomCode, name, playerId }, (res: any) => {
        if (res.ok && res.room && res.playerId) {
          this.saveSession({
            roomCode: res.room.code,
            playerId: res.playerId,
            playerName: name,
          });
        }

        resolve(res);
      });
    });
  }

  public toggleReady() {
    this.socket?.emit('toggle_ready');
  }

  public startRace() {
    this.socket?.emit('start_race');
  }
  public sendTypingAction(key: string) {
    this.socket?.emit('typing_action', key);
  }



  public finishRace() {
    this.socket?.emit('finish_race');
  }

  public playAgain() {
    this.socket?.emit('play_again');
  }

  public leaveRoom() {
    this.clearSession();
    this.socket?.emit('leave_room');
  }

  // Event Listeners
  public onRoomUpdated(callback: (room: Room) => void) {
    this.socket?.on('room_updated', callback);
  }

  public onRaceCountdown(callback: (seconds: number) => void) {
    this.socket?.on('race_countdown', callback);
  }

  public onRaceStarted(callback: (data: { passage: Passage; startTimeMs: number }) => void) {
    this.socket?.on('race_started', callback);
  }

  public onPlayerProgressUpdated(
    callback: (data: { playerId: string; progressRatio: number; wpm: number; accuracy: number }) => void
  ) {
    this.socket?.on('player_progress_updated', callback);
  }

  public onPlayerFinished(
    callback: (data: { playerId: string; rank: number; finishTimeSeconds: number; wpm: number; accuracy: number }) => void
  ) {
    this.socket?.on('player_finished', callback);
  }

  public onRaceFinished(callback: (data: { room: Room }) => void) {
    this.socket?.on('race_finished', callback);
  }

  public onErrorMessage(callback: (error: string) => void) {
    this.socket?.on('error_message', callback);
  }

  public removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export const socketService = new SocketService();
