/**
 * Authentication contracts, mirroring the backend's `PublicUser`, token and
 * session payloads.
 */

export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

/** The account as the API exposes it. Never carries tokens or a password. */
export interface AuthUser {
  id: string
  email: string
  // Optional fields come back as `null`, not absent, so the unions include it.
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  phone?: string | null
  /**
   * Informational only. There is no RBAC on the server yet, so this must not be
   * treated as an authorisation decision — see `useAuth().can()`.
   */
  role?: string
  status?: UserStatus
  emailVerified?: boolean
  phoneVerified?: boolean
  lastLoginAt?: string | null
  avatarUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AuthTokens {
  accessToken: string
  accessTokenExpiresAt?: string
  /** Opaque and single-use — every refresh returns a replacement. */
  refreshToken: string
  refreshTokenExpiresAt?: string
  tokenType?: string
}

/** `POST /auth/login` */
export interface LoginResponse {
  user: AuthUser
  tokens: AuthTokens
  sessionId?: string
}

/** `GET /auth/me` */
export interface MeResponse {
  user: AuthUser
  sessionId?: string
}

/** `POST /auth/register` */
export interface RegisterResponse {
  user: AuthUser
  /** Present outside production only. Never surfaced in the UI. */
  devToken?: string
}

/**
 * Bootstrap is a distinct state from "signed out": on a hard refresh a refresh
 * token exists before the user does, and guards must wait rather than bounce.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  firstName?: string
  lastName?: string
  username?: string
  phone?: string
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  /** Defaults to true server-side when omitted. */
  revokeOtherSessions?: boolean
}

/** One active login, from `GET /auth/sessions`. No tokens are ever returned. */
export interface SessionSummary {
  id: string
  ip?: string
  userAgent?: string
  deviceLabel?: string
  createdAt?: string
  lastUsedAt?: string
  expiresAt?: string
  /** Marks the session the caller's own token belongs to. */
  current?: boolean
}

export interface SessionListResponse {
  sessions: SessionSummary[]
  total: number
}

export interface RevokedSessionsResponse {
  revokedSessions: number
}
