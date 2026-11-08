/**
  * Typing calculation utilities for KeyRush
  */

export interface MatchingResult {
  matchedCount: number; // Number of consecutive correct characters from the beginning
  hasError: boolean; // Whether user input contains an error
  errorIndex: number | null; // Index of the first incorrect character, if any
  isFinished: boolean; // Whether the passage is fully matched
}

export function computeMatching(passageText: string, userInput: string): MatchingResult {
  let matchedCount = 0;
  const minLength = Math.min(passageText.length, userInput.length);

  for (let i = 0; i < minLength; i++) {
    if (userInput[i] === passageText[i]) {
      matchedCount++;
    } else {
      break;
    }
  }

  const hasError = userInput.length > matchedCount;
  const errorIndex = hasError ? matchedCount : null;
  const isFinished = matchedCount === passageText.length;

  return {
    matchedCount,
    hasError,
    errorIndex,
    isFinished,
  };
}

export function calculateWpm(matchedChars: number, elapsedTimeSeconds: number): number {
if (elapsedTimeSeconds < 2 || matchedChars <= 0) {
return 0;
}

// Standard typing speed: 5 characters = 1 word.
const rawWpm = (matchedChars / 5) * (60 / elapsedTimeSeconds);

// Keep one decimal place for smoother, more precise readings.
return Math.round(rawWpm * 10) / 10;
}


export function calculateAccuracy(correctAttempts: number, totalAttempts: number): number {
  if (totalAttempts <= 0) {
    return 100;
  }
  const acc = (correctAttempts / totalAttempts) * 100;
  return Math.min(100, Math.max(0, Math.round(acc * 10) / 10)); // 1 decimal place, e.g. 98.5%
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
  return `${minsStr}:${secsStr}.${ms}`;
}
