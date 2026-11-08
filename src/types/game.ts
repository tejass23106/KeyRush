export type ScreenState =
  | 'home'
  | 'lobby'
  | 'racing'
  | 'results'
  | 'statistics'
  | 'profile'
  | 'leaderboard'
  | 'settings';
export interface Passage {
  id: string;
  title: string;
  text: string;
  author?: string;
}
export interface WpmSample {
  timeSeconds: number;
  wpm: number;
}

export interface RaceStats {
  elapsedTimeSeconds: number;
  wpm: number;
  accuracy: number;
  progressRatio: number; // 0 to 1
  matchedCharCount: number;
  totalAttemptsCount: number;
  correctAttemptsCount: number;
  wpmHistory?: WpmSample[];
}

export type RoomState = 'WAITING' | 'COUNTDOWN' | 'RACING' | 'FINISHED';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  lane: number; // 0 to 3
  progressRatio: number;
  wpm: number;
  accuracy: number;
  wpmHistory?: WpmSample[];
  isFinished: boolean;
  finishRank?: number;
  finishTimeSeconds?: number;
  isConnected: boolean;
  colorHex: number;
}

export interface Room {
  code: string;
  hostId: string;
  state: RoomState;
  passage: Passage;
  players: Player[];
  countdownSeconds: number;
  startTimeMs?: number;
  maxPlayers: number;
}

export const CAR_COLORS: number[] = [
  0xA6472D, // Terracotta (Host / Lane 0)
  0x657155, // Sage Green (Lane 1)
  0x4A6984, // Steel Blue (Lane 2)
  0x8C6D46  // Warm Bronze (Lane 3)
];
