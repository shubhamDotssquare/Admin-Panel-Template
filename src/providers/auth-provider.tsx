import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { appConfig } from '@/config/app.config'
import { authService } from '@/services/auth.service'
import { rbacService } from '@/services/rbac.service'
import { configureHttpClient } from '@/services/http-client'
import { sessionService } from '@/services/session.service'
import type { AssignedRole, PermissionKey } from '@/types/rbac.types'
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
  /** Flattened permission keys from every role this admin holds. */
  permissions: PermissionKey[]
  /** The roles themselves, for display on a profile screen. */
  roles: AssignedRole[]
  /** True once permissions have been fetched, so gates can avoid flicker. */
  permissionsLoaded: boolean
  /** Re-read permissions — after this admin's own roles change. */
  refreshPermissions: () => Promise<void>
  /**
   * Does the signed-in admin hold this permission?
   *
   * Presentation only. The server enforces every one of these independently and
   * answers `PERMISSION_DENIED`; this exists so the UI can hide controls that
   * would only fail, not to secure anything.
   */
  can: (permission: PermissionKey) => boolean
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
  const [permissions, setPermissions] = useState<PermissionKey[]>([])
  const [roles, setRoles] = useState<AssignedRole[]>([])
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)

  const clearSession = useCallback(() => {
    sessionService.clear()
    setUser(null)
    setSessionId(null)
    setPermissions([])
    setRoles([])
    setPermissionsLoaded(false)
    setStatus('unauthenticated')
  }, [])

  /**
   * Load the signed-in admin's permissions.
   *
   * Failure is deliberately non-fatal: a permissions outage should degrade the
   * UI to "nothing extra is offered", not lock someone out of a panel they are
   * legitimately signed in to. The server still refuses anything they may not do.
   */
  const refreshPermissions = useCallback(async () => {
    try {
      const result = await rbacService.myPermissions()
      setPermissions(result?.effectivePermissions ?? [])
      setRoles(result?.roles ?? [])
    } catch {
      setPermissions([])
      setRoles([])
    } finally {
      setPermissionsLoaded(true)
    }
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
        void refreshPermissionsRef.current()
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
  const refreshPermissionsRef = useRef(refreshPermissions)
  refreshPermissionsRef.current = refreshPermissions

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

    // Permissions are loaded alongside the user on every hydrate, so no screen
    // ever has to wonder whether they are present.
    await refreshPermissions()
    return current
  }, [refreshPermissions])

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

  const signIn = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await authService.login(credentials)

      sessionService.setTokens(result.tokens)
      setUser(result.user)
      setSessionId(result.sessionId ?? null)
      setStatus('authenticated')

      // Awaited, not fired and forgotten: the screen the user lands on decides
      // what to render from these, and an empty set would flash a stripped nav.
      await refreshPermissions()

      return result
    },
    [refreshPermissions],
  )

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

  const can = useCallback(
    (permission: PermissionKey) => {
      // With auth switched off the panel runs with no backend at all, so gating
      // would leave every screen empty. That mode is for local development only.
      if (!authEnabled) return true
      return permissions.includes(permission)
    },
    [authEnabled, permissions],
  )

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
      permissions,
      roles,
      permissionsLoaded,
      refreshPermissions,
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
      permissions,
      roles,
      permissionsLoaded,
      refreshPermissions,
      can,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
