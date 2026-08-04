/**
 * JSON-safe wrapper around Web Storage.
 *
 * Every method is failure-tolerant: private browsing, disabled storage and
 * quota errors degrade to a no-op rather than throwing into a render.
 */

type StorageType = 'local' | 'session'

function getStore(type: StorageType): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return type === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function getStorageItem<T>(key: string, fallback: T, type: StorageType = 'local'): T {
  const store = getStore(type)
  if (!store) return fallback

  try {
    const raw = store.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function setStorageItem<T>(key: string, value: T, type: StorageType = 'local'): void {
  const store = getStore(type)
  if (!store) return

  try {
    store.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded or storage blocked — nothing useful to do here.
  }
}

export function removeStorageItem(key: string, type: StorageType = 'local'): void {
  getStore(type)?.removeItem(key)
}
