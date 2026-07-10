const CACHE_PREFIX = 'preuni_cache_';
const QUEUE_KEY = CACHE_PREFIX + 'sync_queue';

export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, expiry } = JSON.parse(raw);
    if (expiry && Date.now() > expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

export function setCache(key: string, data: any, ttlMinutes = 1440) {
  try {
    const entry = { data, expiry: Date.now() + ttlMinutes * 60 * 1000 };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

export function clearCache() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(CACHE_PREFIX))
    .forEach(k => localStorage.removeItem(k));
}

export function getQueue(): any[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToQueue(entry: any) {
  const queue = getQueue();
  queue.push({ ...entry, _queuedAt: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export function isOnline() {
  return navigator.onLine;
}
