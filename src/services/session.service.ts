import { STORAGE_KEYS } from '@/constants/storage-keys'
import type { AuthTokens } from '@/types/auth.types'
import { getStorageItem, removeStorageItem, setStorageItem } from '@/utils/storage'

/**
 * Token custody.
 *
 * The access token is held **in memory only**. It is short-lived (~15 min) and
 * replaceable from the refresh token, so persisting it would widen the XSS blast
 * radius for no real gain — a reload simply refreshes.
 *
 * The refresh token *is* persisted, because without it every reload would mean
 * signing in again. localStorage is what this codebase already uses for
 * durable client state, and the API has no httpOnly-cookie option yet: it
 * returns tokens in the JSON body, not as `Set-Cookie`. Move this to a cookie
 * the moment the backend can set one — this module is the only thing that would
 * change.
 */

let accessToken: string | null = null
let accessTokenExpiresAt: number | null = null

/** Treat a token as expired slightly early so it cannot lapse mid-flight. */
const EXPIRY_SKEW_MS = 5_000

function toTimestamp(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

export const sessionService = {
  getAccessToken(): string | null {
    return accessToken
  },

  getRefreshToken(): string | null {
    return getStorageItem<string | null>(STORAGE_KEYS.refreshToken, null)
  },

  /**
   * Persist a token pair.
   *
   * **Both tokens must be written every time.** `/auth/refresh` is single-use and
   * returns a new refresh token on every call, permanently invalidating the one
   * that was sent. Keeping the old one would send it again on the next refresh,
   * which the server reads as reuse and answers by revoking the entire session.
   */
  setTokens(tokens: AuthTokens): void {
    accessToken = tokens.accessToken
    accessTokenExpiresAt = toTimestamp(tokens.accessTokenExpiresAt)
    setStorageItem(STORAGE_KEYS.refreshToken, tokens.refreshToken)
  },

  clear(): void {
    accessToken = null
    accessTokenExpiresAt = null
    removeStorageItem(STORAGE_KEYS.refreshToken)
    // Written by older builds that persisted the access token; drop it so a
    // stale value cannot outlive an upgrade.
    removeStorageItem(STORAGE_KEYS.authToken)
  },

  /** True when an access token is held and not within the expiry skew. */
  hasValidAccessToken(): boolean {
    if (!accessToken) return false
    if (accessTokenExpiresAt === null) return true
    return Date.now() < accessTokenExpiresAt - EXPIRY_SKEW_MS
  },

  /**
   * A refresh token exists, so a session is worth attempting to restore.
   *
   * This is what the app checks on boot — the access token is always absent at
   * that point, since it never leaves memory.
   */
  hasSession(): boolean {
    return Boolean(this.getRefreshToken())
  },
}
