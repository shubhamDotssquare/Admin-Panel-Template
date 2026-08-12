import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { appConfig } from '@/config/app.config'
import { authService } from '@/services/auth.service'
import { configureHttpClient } from '@/services/http-client'
import { sessionService } from '@/services/session.service'
import type {
  AuthStatus,
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from '@/types/auth.types'

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  /** Exposed for debugging and rare manual calls; requests attach it themselves. */
  accessToken: string | null
  sessionId: string | null
  isAuthenticated: boolean
  /** True during the initial refresh-then-hydrate bootstrap. */
  isLoading: boolean
  signIn: (credentials: LoginCredentials) => Promise<LoginResponse>
  register: (payload: RegisterPayload) => Promise<RegisterResponse>
  signOut: () => Promise<void>
  /** Ends every session for this user, then signs out locally. */
  signOutEverywhere: () => Promise<number>
  /** Force a token refresh. Resolves false when the session is unrecoverable. */
  refresh: () => Promise<boolean>
  /** Re-read the current user — after a profile edit, say. */
  fetchMe: () => Promise<AuthUser | null>
  /**
   * Permission check. **There is no server-side RBAC yet**, so this is a UI
   * convenience only and must never be the sole gate on a sensitive action.
   */
  can: (permission: string) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Owns authentication state, token custody and the sign-in lifecycle.
 *
 * Three properties are load-bearing:
 *
 * 1. **Boot is refresh-then-hydrate.** The access token lives in memory only, so
 *    after a reload the only credential on hand is the refresh token: exchange
 *    it, then call `/auth/me`.
 * 2. **`status` distinguishes `loading` from `unauthenticated`.** Guards must
 *    wait out the bootstrap rather than bounce the visitor to `/login`.
 * 3. **It stays inert while `appConfig.auth.enabled` is false**, so the panel
 *    still runs with no backend — which is how the template ships.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authEnabled = appConfig.auth.enabled

  const [status, setStatus] = useState<AuthStatus>(() => {
    if (!authEnabled) return 'unauthenticated'
    return sessionService.hasSession() ? 'loading' : 'unauthenticated'
  })
  const [user, setUser] = useState<AuthUser | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const clearSession = useCallback(() => {
    sessionService.clear()
    setUser(null)
    setSessionId(null)
    setStatus('unauthenticated')
  }, [])

  /**
   * The in-flight refresh, shared by every caller.
   *
   * This is the authoritative de-duplication point, and it is load-bearing
   * rather than an optimisation. Refresh tokens are single-use: two overlapping
   * refreshes would send the same token twice, and the server reads the second
   * as reuse and revokes the entire session. React's StrictMode double-invokes
   * the bootstrap effect in development, so this is reached on an ordinary page
   * load, not only under contrived races.
   */
  const refreshInFlight = useRef<Promise<boolean> | null>(null)

  /**
   * Exchange the refresh token for a new pair.
   *
   * Both tokens are written together by `setTokens`, which is what keeps the
   * next refresh from replaying a spent token and tripping the server's reuse
   * detection.
   */
  const runRefresh = useCallback(async (): Promise<boolean> => {
    const refreshToken = sessionService.getRefreshToken()
    if (!refreshToken) return false

    try {
      const {
        tokens,
        user: refreshedUser,
        sessionId: refreshedSessionId,
      } = await authService.refresh(refreshToken)

      sessionService.setTokens(tokens)

      // The live API returns the user alongside the new tokens. Adopting it here
      // saves a `/auth/me` round trip on boot; when a backend returns bare
      // tokens instead, the bootstrap below falls back to fetching.
      if (refreshedUser) {
        setUser(refreshedUser)
        setSessionId(refreshedSessionId ?? null)
        setStatus('authenticated')
      }

      return true
    } catch {
      // Expired, invalid, or reuse-detected — all unrecoverable from here.
      clearSession()
      return false
    }
  }, [clearSession])

  /** Public entry point: joins an in-flight refresh rather than starting a second. */
  const refresh = useCallback((): Promise<boolean> => {
    refreshInFlight.current ??= runRefresh().finally(() => {
      refreshInFlight.current = null
    })

    return refreshInFlight.current
  }, [runRefresh])

  // The http client needs these hooks but must not import auth or session code
  // itself. Refs keep the wiring stable so it is installed exactly once, before
  // the bootstrap below can fire.
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh
  const clearSessionRef = useRef(clearSession)
  clearSessionRef.current = clearSession
  // Read after an await, where the captured `status` would be stale.
  const statusRef = useRef(status)
  statusRef.current = status

  useEffect(() => {
    configureHttpClient({
      getToken: () => sessionService.getAccessToken(),
      refresh: () => refreshRef.current(),
      onUnauthorized: () => clearSessionRef.current(),
    })
  }, [])

  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    const { user: current, sessionId: currentSessionId } = await authService.me()
    setUser(current)
    setSessionId(currentSessionId ?? null)
    setStatus('authenticated')
    return current
  }, [])

  // Restore a session once per mount: refresh, then hydrate.
  useEffect(() => {
    if (!authEnabled || !sessionService.hasSession()) return

    let cancelled = false

    void (async () => {
      const refreshed = await refreshRef.current()
      if (cancelled || !refreshed) return // `refresh()` already cleared on failure.

      // Only needed when the refresh response carried no user of its own.
      if (statusRef.current === 'authenticated') return

      try {
        await fetchMe()
      } catch {
        if (!cancelled) clearSession()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authEnabled, clearSession, fetchMe])

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials)

    sessionService.setTokens(result.tokens)
    setUser(result.user)
    setSessionId(result.sessionId ?? null)
    setStatus('authenticated')

    return result
  }, [])

  /** Registration does not sign anyone in — the account is PENDING until verified. */
  const register = useCallback((payload: RegisterPayload) => authService.register(payload), [])

  const signOut = useCallback(async () => {
    // Revoke server-side first: once the token is gone the call cannot be made.
    // Failure is ignored on purpose — local tokens are cleared either way.
    if (authEnabled && sessionService.hasValidAccessToken()) {
      try {
        await authService.logout()
      } catch {
        // Already invalid, offline, or revoked elsewhere.
      }
    }

    clearSession()
  }, [authEnabled, clearSession])

  const signOutEverywhere = useCallback(async () => {
    let revoked = 0

    try {
      const result = await authService.logoutAll()
      revoked = result?.revokedSessions ?? 0
    } finally {
      // The current session is among those revoked, so local state must go too.
      clearSession()
    }

    return revoked
  }, [clearSession])

  const can = useCallback((_permission: string) => {
    // No RBAC server-side yet, so gating the UI on a role would imply an
    // enforcement that does not exist. Everything is permitted; revisit when
    // the backend grows real permissions.
    void _permission
    return true
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      accessToken: sessionService.getAccessToken(),
      sessionId,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      signIn,
      register,
      signOut,
      signOutEverywhere,
      refresh,
      fetchMe,
      can,
    }),
    [
      status,
      user,
      sessionId,
      signIn,
      register,
      signOut,
      signOutEverywhere,
      refresh,
      fetchMe,
      can,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
