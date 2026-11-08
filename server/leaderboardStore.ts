import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Player } from '../src/types/game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'leaderboard.json');

export interface LeaderboardEntry {
  name: string;
  bestWpm: number;
  bestAccuracy: number;
  racesPlayed: number;
  raceWins: number;
}

export class LeaderboardStore {
  private read(): LeaderboardEntry[] {
    try {
      if (!fs.existsSync(DATA_FILE)) return [];

      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return Array.isArray(data) ? data : [];
    } catch {
      console.error('Could not read leaderboard data.');
      return [];
    }
  }

  private write(entries: LeaderboardEntry[]): void {
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf8');
  }

  public getLeaderboard(): LeaderboardEntry[] {
    return this.read()
      .sort(
        (a, b) =>
          b.raceWins - a.raceWins ||
          b.bestWpm - a.bestWpm ||
          b.bestAccuracy - a.bestAccuracy
      )
      .slice(0, 100);
  }

  public recordRace(players: Player[]): void {
    const entries = this.read();

    for (const player of players) {
      const name = player.name.trim().slice(0, 30);
      if (!name) continue;

      const key = name.toLowerCase();
      let entry = entries.find((item) => item.name.toLowerCase() === key);

      if (!entry) {
        entry = {
          name,
          bestWpm: 0,
          bestAccuracy: 0,
          racesPlayed: 0,
          raceWins: 0,
        };
        entries.push(entry);
      }

      entry.racesPlayed += 1;
      entry.bestWpm = Math.max(
        entry.bestWpm,
        Math.max(0, Number(player.wpm) || 0)
      );
      entry.bestAccuracy = Math.max(
        entry.bestAccuracy,
        Math.min(100, Math.max(0, Number(player.accuracy) || 0))
      );

      if (player.finishRank === 1) {
        entry.raceWins += 1;
      }
    }

    this.write(entries);
  }
}