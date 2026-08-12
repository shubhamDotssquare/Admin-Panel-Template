import { API_ENDPOINTS } from '@/constants/api-endpoints'
import type {
  AuthTokens,
  AuthUser,
  ChangePasswordPayload,
  LoginCredentials,
  LoginResponse,
  MeResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
  RevokedSessionsResponse,
  SessionListResponse,
} from '@/types/auth.types'
import { httpClient } from './http-client'

/** A refresh, normalised: tokens always, plus the user when the API sends one. */
export interface RefreshResult {
  tokens: AuthTokens
  user?: AuthUser
  sessionId?: string
}

/**
 * The auth API, free of storage and React concerns.
 *
 * `AuthProvider` owns token custody and state; this module only speaks HTTP. The
 * envelope is unwrapped by the http client, so these return `data` directly.
 *
 * `skipAuth` marks the endpoints that must not carry an Authorization header —
 * either because no session exists yet, or because sending a stale token would
 * make the call fail for the wrong reason.
 */
export const authService = {
  /**
   * Create an account.
   *
   * The user lands in `status: "PENDING"` and cannot sign in until their email
   * is verified. The `devToken` in non-production responses is a testing aid and
   * is deliberately never surfaced in the UI.
   */
  register: (payload: RegisterPayload) =>
    httpClient.post<RegisterResponse>(API_ENDPOINTS.auth.register, payload, { skipAuth: true }),

  login: (credentials: LoginCredentials) =>
    httpClient.post<LoginResponse>(API_ENDPOINTS.auth.login, credentials, { skipAuth: true }),

  /**
   * Exchange the refresh token for a new pair.
   *
   * `skipAuth` matters here: the access token is expired by definition at this
   * point, and sending it would only invite a 401 on the very call meant to fix
   * that. The caller **must** persist both returned tokens — the one sent is now
   * permanently spent.
   *
   * The response shape is normalised because the live API answers with the full
   * `{ user, tokens, sessionId }` envelope while the written contract describes
   * a bare token object. Accepting both means a backend change on this point
   * cannot silently break session restoration.
   */
  async refresh(refreshToken: string): Promise<RefreshResult> {
    const payload = await httpClient.post<Partial<LoginResponse> & Partial<AuthTokens>>(
      API_ENDPOINTS.auth.refresh,
      { refreshToken },
      { skipAuth: true },
    )

    const tokens = payload.tokens ?? (payload as AuthTokens)

    if (!tokens?.accessToken || !tokens.refreshToken) {
      throw new Error('The refresh response did not include a token pair.')
    }

    return { tokens, user: payload.user, sessionId: payload.sessionId }
  },

  /** Resolve the current access token to a user — the app-boot hydration call. */
  me: () => httpClient.get<MeResponse>(API_ENDPOINTS.auth.me),

  /**
   * End this session. Local tokens are cleared by the caller regardless of the
   * outcome, so a failed request never traps the user in a dead session.
   */
  logout: () => httpClient.post<null>(API_ENDPOINTS.auth.logout),

  /** End every session for this user, including the current one. */
  logoutAll: () => httpClient.post<RevokedSessionsResponse>(API_ENDPOINTS.auth.logoutAll),

  /**
   * Request a reset link.
   *
   * Always 200 with identical copy whether or not the address exists — the UI
   * must not reveal which, or it becomes an account-enumeration oracle.
   */
  forgotPassword: (email: string) =>
    httpClient.post<{ devToken?: string } | null>(
      API_ENDPOINTS.auth.forgotPassword,
      { email },
      { skipAuth: true },
    ),

  /**
   * Set a new password from an emailed link.
   *
   * Succeeding signs the user out of **every** device, so the caller must send
   * them to sign-in rather than trying to keep the current session alive.
   */
  resetPassword: ({ token, newPassword }: ResetPasswordPayload) =>
    httpClient.post<null>(
      API_ENDPOINTS.auth.resetPassword,
      { token, newPassword },
      { skipAuth: true },
    ),

  /** Confirm an address from the emailed link's token. */
  verifyEmail: (token: string) =>
    httpClient.post<{ user: MeResponse['user'] }>(
      API_ENDPOINTS.auth.verifyEmail,
      { token },
      { skipAuth: true },
    ),

  /** Always 200, with the same non-committal copy as `forgotPassword`. */
  resendVerification: (email: string) =>
    httpClient.post<null>(API_ENDPOINTS.auth.resendVerification, { email }, { skipAuth: true }),

  /** Change the password of the signed-in user. */
  changePassword: (payload: ChangePasswordPayload) =>
    httpClient.post<RevokedSessionsResponse>(API_ENDPOINTS.auth.changePassword, payload),

  /** Active logins for this user. `current: true` marks the caller's own. */
  listSessions: () => httpClient.get<SessionListResponse>(API_ENDPOINTS.auth.sessions),

  /** Revoke one device. 404 when the id is not the caller's. */
  revokeSession: (sessionId: string) =>
    httpClient.delete<null>(API_ENDPOINTS.auth.session(sessionId)),
}

export type AuthService = typeof authService
