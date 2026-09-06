// Local storage utilities
const STORAGE_PREFIX = 'luaforge-x:';

export function saveToStorage(key: string, value: any): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
  }
  return defaultValue;
}

export function clearStorage(): void {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
}

// Specific storage functions
export function saveLastSource(source: string): void {
  saveToStorage('last-source', source);
}

export function loadLastSource(): string {
  return loadFromStorage('last-source', '');
}

export function saveSettings(settings: any): void {
  saveToStorage('settings', settings);
}

export function loadSettings(): any {
  return loadFromStorage('settings', {});
}
