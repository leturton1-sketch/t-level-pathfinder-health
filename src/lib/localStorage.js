const STORAGE_VERSION = 1;

export function readStoredValue(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== STORAGE_VERSION) return fallback;
    return parsed.data ?? fallback;
  } catch (error) {
    console.error(`Unable to read local storage key "${key}".`, error);
    return fallback;
  }
}

export function writeStoredValue(key, data) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, data }));
    return true;
  } catch (error) {
    console.error(`Unable to write local storage key "${key}".`, error);
    return false;
  }
}
