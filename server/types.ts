import { Room } from '../src/types/game';

export interface CreateRoomResponse {
  ok: boolean;
  roomCode?: string;
  room?: Room;
  playerId?: string;
  error?: string;
}

export interface JoinRoomResponse {
  ok: boolean;
  room?: Room;
  playerId?: string;
  error?: string;
}

export interface ProgressPayload {
  progressRatio: number;
  wpm: number;
  accuracy: number;
}

export interface FinishPayload {
  elapsedTimeSeconds: number;
  wpm: number;
  accuracy: number;
}
