import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Room, WpmSample } from '../src/types/game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'statistics.json');

const MAX_RECORDS = 10000;

export interface MultiplayerRaceRecord {
  id: string;
  raceId: string;
  playerId: string;
  playerName: string;
  roomCode: string;
  playedAt: string;
  passageId: string;
  passageTitle: string;
  rank: number;
  wpm: number;
  accuracy: number;
  progressRatio: number;
  isFinished: boolean;
  finishTimeSeconds?: number;
  wpmHistory: WpmSample[];
}

export class StatisticsStore {
  private read(): MultiplayerRaceRecord[] {
    try {
      if (!fs.existsSync(DATA_FILE)) return [];

      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

      return Array.isArray(data) ? data : [];
    } catch {
      console.error('Could not read multiplayer statistics.');
      return [];
    }
  }

  private write(records: MultiplayerRaceRecord[]): void {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(records, null, 2),
      'utf8'
    );
  }

  public recordRace(room: Room): void {
    const records = this.read();

    const playedAt = new Date().toISOString();
    const raceId = `${room.code}-${Date.now()}`;

    for (const player of room.players) {
      const playerName = player.name.trim().slice(0, 30);

      if (!playerName) continue;

      const record: MultiplayerRaceRecord = {
        id: `${raceId}-${player.id}`,
        raceId,
        playerId: player.id,
        playerName,
        roomCode: room.code,
        playedAt,
        passageId: room.passage.id,
        passageTitle: room.passage.title,
        rank: player.finishRank ?? 0,
        wpm: Math.max(0, Number(player.wpm) || 0),
        accuracy: Math.min(
          100,
          Math.max(0, Number(player.accuracy) || 0)
        ),
        progressRatio: Math.min(
          1,
          Math.max(0, Number(player.progressRatio) || 0)
        ),
        isFinished: player.isFinished,
        finishTimeSeconds: player.finishTimeSeconds,
        wpmHistory: (player.wpmHistory ?? []).map((sample) => ({
          timeSeconds: sample.timeSeconds,
          wpm: sample.wpm,
        })),
      };

      records.push(record);
    }

    // Keep the most recent records.
    records.sort(
      (a, b) =>
        new Date(b.playedAt).getTime() -
        new Date(a.playedAt).getTime()
    );

    this.write(records.slice(0, MAX_RECORDS));
  }

  public getPlayerHistory(playerName: string): MultiplayerRaceRecord[] {
    const key = playerName.trim().toLowerCase();

    if (!key) return [];

    return this.read()
      .filter(
        (record) => record.playerName.trim().toLowerCase() === key
      )
      .sort(
        (a, b) =>
          new Date(b.playedAt).getTime() -
          new Date(a.playedAt).getTime()
      );
  }

  public getAllRecords(): MultiplayerRaceRecord[] {
    return this.read();
  }
}