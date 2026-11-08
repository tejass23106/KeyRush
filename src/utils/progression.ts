import type { RaceStats } from '../types/game';

const STORAGE_KEY = 'keyrush:progression:v1';
const MAX_SAVED_RACE_IDS = 1000;

export interface ProgressionData {
  totalXp: number;
  totalRaces: number;
  bestWpm: number;
  bestAccuracy: number;
  awardedRaceIds: string[];
}

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  progressPercent: number;
}

export interface XpAwardResult {
  progression: ProgressionData;
  xpAwarded: number;
  alreadyAwarded: boolean;
}

function createDefaultProgression(): ProgressionData {
  return {
    totalXp: 0,
    totalRaces: 0,
    bestWpm: 0,
    bestAccuracy: 0,
    awardedRaceIds: [],
  };
}

/**
 * Loads progression safely from localStorage.
 */
export function loadProgression(): ProgressionData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return createDefaultProgression();
    }

    const parsed: unknown = JSON.parse(saved);

    if (!parsed || typeof parsed !== 'object') {
      return createDefaultProgression();
    }

    const data = parsed as Partial<ProgressionData>;

    const numberOrZero = (value: unknown): number => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 0;
      }

      return Math.max(0, value);
    };

    return {
      totalXp: Math.floor(numberOrZero(data.totalXp)),
      totalRaces: Math.floor(numberOrZero(data.totalRaces)),
      bestWpm: numberOrZero(data.bestWpm),
      bestAccuracy: Math.min(
        100,
        numberOrZero(data.bestAccuracy)
      ),
      awardedRaceIds: Array.isArray(data.awardedRaceIds)
        ? data.awardedRaceIds
            .filter((id): id is string => typeof id === 'string')
            .slice(-MAX_SAVED_RACE_IDS)
        : [],
    };
  } catch {
    return createDefaultProgression();
  }
}

/**
 * Saves progression safely.
 */
function saveProgression(data: ProgressionData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Could not save KeyRush progression:', error);
  }
}

/**
 * Calculates XP for a completed race.
 *
 * Completion bonus: 50 XP
 * Speed bonus: up to 20 XP
 * Accuracy bonus: up to 20 XP
 */
export function calculateRaceXp(
  stats: Pick<RaceStats, 'wpm' | 'accuracy'>
): number {
  const wpm = Number.isFinite(stats.wpm)
    ? Math.max(0, stats.wpm)
    : 0;

  const accuracy = Number.isFinite(stats.accuracy)
    ? Math.min(100, Math.max(0, stats.accuracy))
    : 0;

  const completionBonus = 50;
  const speedBonus = Math.min(
    20,
    Math.floor(wpm / 10) * 2
  );
  const accuracyBonus = Math.round(accuracy / 5);

  return completionBonus + speedBonus + accuracyBonus;
}

/**
 * Awards XP exactly once for a particular race ID.
 */
export function awardRaceXp(
  raceId: string,
  stats: Pick<RaceStats, 'wpm' | 'accuracy'>
): XpAwardResult {
  const current = loadProgression();

  if (
    !raceId ||
    current.awardedRaceIds.includes(raceId)
  ) {
    return {
      progression: current,
      xpAwarded: 0,
      alreadyAwarded: true,
    };
  }

  const xpAwarded = calculateRaceXp(stats);

  const wpm = Number.isFinite(stats.wpm)
    ? Math.max(0, stats.wpm)
    : 0;

  const accuracy = Number.isFinite(stats.accuracy)
    ? Math.min(100, Math.max(0, stats.accuracy))
    : 0;

  const updated: ProgressionData = {
    totalXp: current.totalXp + xpAwarded,
    totalRaces: current.totalRaces + 1,
    bestWpm: Math.max(current.bestWpm, wpm),
    bestAccuracy: Math.max(current.bestAccuracy, accuracy),
    awardedRaceIds: [
      ...current.awardedRaceIds,
      raceId,
    ].slice(-MAX_SAVED_RACE_IDS),
  };

  saveProgression(updated);

  return {
    progression: updated,
    xpAwarded,
    alreadyAwarded: false,
  };
}

/**
 * Level 1 requires 250 XP to reach Level 2.
 * Each subsequent level requires 100 additional XP.
 */
export function getLevelInfo(totalXp: number): LevelInfo {
  let remainingXp = Number.isFinite(totalXp)
    ? Math.max(0, Math.floor(totalXp))
    : 0;

  let level = 1;
  let xpToNextLevel = 250;

  while (remainingXp >= xpToNextLevel) {
    remainingXp -= xpToNextLevel;
    level += 1;
    xpToNextLevel = 250 + (level - 1) * 100;
  }

  return {
    level,
    currentLevelXp: remainingXp,
    xpToNextLevel,
    progressPercent: Math.min(
      100,
      (remainingXp / xpToNextLevel) * 100
    ),
  };
}