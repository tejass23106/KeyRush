export interface SoloRaceRecord {
  id: string;
  playedAt: string;
  passageId: string;
  passageTitle: string;
  elapsedTimeSeconds: number;
  wpm: number;
  accuracy: number;
  matchedCharCount: number;
  totalAttemptsCount: number;
  correctAttemptsCount: number;
  mistakesCount: number;
}

const STORAGE_KEY = 'keyrush:solo:history:v1';
const MAX_HISTORY = 500;

function isSoloRaceRecord(value: unknown): value is SoloRaceRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Partial<SoloRaceRecord>;

  return (
    typeof record.id === 'string' &&
    typeof record.playedAt === 'string' &&
    Number.isFinite(Date.parse(record.playedAt)) &&
    typeof record.passageId === 'string' &&
    typeof record.passageTitle === 'string' &&
    typeof record.elapsedTimeSeconds === 'number' &&
    Number.isFinite(record.elapsedTimeSeconds) &&
    record.elapsedTimeSeconds >= 0 &&
    typeof record.wpm === 'number' &&
    Number.isFinite(record.wpm) &&
    record.wpm >= 0 &&
    typeof record.accuracy === 'number' &&
    Number.isFinite(record.accuracy) &&
    record.accuracy >= 0 &&
    record.accuracy <= 100 &&
    typeof record.matchedCharCount === 'number' &&
    Number.isFinite(record.matchedCharCount) &&
    typeof record.totalAttemptsCount === 'number' &&
    Number.isFinite(record.totalAttemptsCount) &&
    typeof record.correctAttemptsCount === 'number' &&
    Number.isFinite(record.correctAttemptsCount) &&
    typeof record.mistakesCount === 'number' &&
    Number.isFinite(record.mistakesCount)
  );
}

export function loadSoloRaceHistory(): SoloRaceRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isSoloRaceRecord)
      .sort(
        (a, b) =>
          Date.parse(b.playedAt) - Date.parse(a.playedAt)
      )
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function saveSoloRaceHistory(
  records: SoloRaceRecord[]
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const sortedRecords = [...records]
      .sort(
        (a, b) =>
          Date.parse(b.playedAt) - Date.parse(a.playedAt)
      )
      .slice(0, MAX_HISTORY);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sortedRecords)
    );
  } catch {
    // The game must remain usable if browser storage is unavailable.
  }
}