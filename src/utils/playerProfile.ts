const STORAGE_KEY = 'keyrush:profile:v1';

const DEFAULT_DISPLAY_NAME = 'Racer';
const MAX_DISPLAY_NAME_LENGTH = 24;

export function normalizeDisplayName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_DISPLAY_NAME_LENGTH);
}

export function loadDisplayName(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const normalized = normalizeDisplayName(saved);
      return normalized || DEFAULT_DISPLAY_NAME;
    }

    return DEFAULT_DISPLAY_NAME;
  } catch {
    return DEFAULT_DISPLAY_NAME;
  }
}

export function saveDisplayName(value: string): string {
  const normalized =
    normalizeDisplayName(value) || DEFAULT_DISPLAY_NAME;

  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch (error) {
    console.error('Could not save KeyRush profile:', error);
  }

  return normalized;
}