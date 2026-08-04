import { STORAGE_KEYS } from '@/constants/storage-keys'
import { getStorageItem, removeStorageItem, setStorageItem } from '@/utils/storage'

/**
 * Token storage only — no login flow, no user model.
 *
 * The Admin Manager module owns authentication itself; the shell just needs to
 * know whether a session token exists so route guards can act on it.
 */
export const sessionService = {
  getToken(): string | null {
    return getStorageItem<string | null>(STORAGE_KEYS.authToken, null)
  },

  getRefreshToken(): string | null {
    return getStorageItem<string | null>(STORAGE_KEYS.refreshToken, null)
  },

  setTokens(tokens: { accessToken: string; refreshToken?: string }): void {
    setStorageItem(STORAGE_KEYS.authToken, tokens.accessToken)
    if (tokens.refreshToken) {
      setStorageItem(STORAGE_KEYS.refreshToken, tokens.refreshToken)
    }
  },

  clear(): void {
    removeStorageItem(STORAGE_KEYS.authToken)
    removeStorageItem(STORAGE_KEYS.refreshToken)
  },

  hasSession(): boolean {
    return Boolean(this.getToken())
  },
}
