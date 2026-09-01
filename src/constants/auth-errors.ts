/**
 * Every `error.code` the auth API can return, mapped once to copy and a UI
 * action.
 *
 * Call sites branch on the code — never on `error.message`, which is
 * human-readable and free to change server-side. Where the server's own message
 * is more specific than anything we can write in advance (a lockout countdown,
 * a validation detail), `preferServerMessage` says so and the transport layer's
 * message wins.
 */

export const AUTH_ERROR_CODES = {
  validation: 'VALIDATION_ERROR',
  invalidCredentials: 'INVALID_CREDENTIALS',
  accountLocked: 'ACCOUNT_LOCKED',
  accountInactive: 'ACCOUNT_INACTIVE',
  emailNotVerified: 'EMAIL_NOT_VERIFIED',
  emailAlreadyRegistered: 'EMAIL_ALREADY_REGISTERED',
  passwordNotSet: 'PASSWORD_NOT_SET',
  passwordReused: 'PASSWORD_REUSED',
  tokenMissing: 'TOKEN_MISSING',
  tokenInvalid: 'TOKEN_INVALID',
  tokenExpired: 'TOKEN_EXPIRED',
  tokenUsed: 'TOKEN_USED',
  tokenRevoked: 'TOKEN_REVOKED',
  tokenReuseDetected: 'TOKEN_REUSE_DETECTED',
  sessionNotFound: 'SESSION_NOT_FOUND',
  sessionExpired: 'SESSION_EXPIRED',
  sessionRevoked: 'SESSION_REVOKED',
  otpInvalid: 'OTP_INVALID',
  otpExpired: 'OTP_EXPIRED',
  otpMaxAttempts: 'OTP_MAX_ATTEMPTS_REACHED',
  otpResendTooSoon: 'OTP_RESEND_TOO_SOON',
  rateLimited: 'RATE_LIMITED',

  // ── Authorisation and domain rules ────────────────────────────────
  permissionDenied: 'PERMISSION_DENIED',
  notFound: 'NOT_FOUND',
  conflict: 'CONFLICT',
  roleAlreadyExists: 'ROLE_ALREADY_EXISTS',
  systemRoleProtected: 'SYSTEM_ROLE_PROTECTED',
  roleHierarchyCycle: 'ROLE_HIERARCHY_CYCLE',
  businessRuleViolation: 'BUSINESS_RULE_VIOLATION',
} as const

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES]

/**
 * What the UI should do about a failure, beyond showing the message.
 *
 * `signOut` is the important one: it marks the codes that mean the session is
 * gone for good, so the app clears tokens instead of retrying.
 */
export type AuthErrorAction =
  | 'none'
  /** Session is unrecoverable — clear tokens and return to sign-in. */
  | 'signOut'
  /** Offer to resend the verification email. */
  | 'resendVerification'
  /** Offer to request a fresh link. */
  | 'requestNewLink'
  /** Attach the message to a specific form field. */
  | 'field'

interface AuthErrorMeta {
  message: string
  action: AuthErrorAction
  /** Field the message belongs on, when `action` is `field`. */
  field?: string
  /** The server's message is more specific than ours — show theirs. */
  preferServerMessage?: boolean
}

export const AUTH_ERROR_META: Record<string, AuthErrorMeta> = {
  [AUTH_ERROR_CODES.validation]: {
    message: 'Please correct the highlighted fields and try again.',
    action: 'none',
  },

  // Deliberately identical for unknown-email and wrong-password: the backend
  // refuses to distinguish them, and neither should the UI.
  [AUTH_ERROR_CODES.invalidCredentials]: {
    message: 'That email or password is incorrect.',
    action: 'none',
  },

  // The server's copy carries the remaining lockout time; ours never could.
  [AUTH_ERROR_CODES.accountLocked]: {
    message: 'This account is temporarily locked after too many failed attempts.',
    action: 'none',
    preferServerMessage: true,
  },
  [AUTH_ERROR_CODES.accountInactive]: {
    message: 'This account is inactive. Contact an administrator to restore access.',
    action: 'none',
  },
  [AUTH_ERROR_CODES.emailNotVerified]: {
    message: 'Confirm your email address before signing in.',
    action: 'resendVerification',
  },
  [AUTH_ERROR_CODES.emailAlreadyRegistered]: {
    message: 'That email is already in use.',
    action: 'field',
    field: 'email',
  },
  [AUTH_ERROR_CODES.passwordNotSet]: {
    message: 'This account has no password set. Use the password reset link to choose one.',
    action: 'requestNewLink',
  },
  [AUTH_ERROR_CODES.passwordReused]: {
    message: 'Choose a password you have not used before.',
    action: 'field',
    field: 'newPassword',
  },

  // ── Link and token failures ───────────────────────────────────────
  [AUTH_ERROR_CODES.tokenMissing]: {
    message: 'This link is missing its token. Request a new one.',
    action: 'requestNewLink',
  },
  [AUTH_ERROR_CODES.tokenInvalid]: {
    message: 'This link is no longer valid. Request a new one.',
    action: 'requestNewLink',
  },
  [AUTH_ERROR_CODES.tokenExpired]: {
    message: 'This link has expired. Request a new one.',
    action: 'requestNewLink',
  },
  [AUTH_ERROR_CODES.tokenUsed]: {
    message: 'This link has already been used. Request a new one.',
    action: 'requestNewLink',
  },
  [AUTH_ERROR_CODES.tokenRevoked]: {
    message: 'Please sign in again.',
    action: 'signOut',
  },

  // Reuse means the server killed the whole session as a precaution. The user
  // does not need to know why — only that they must sign in again.
  [AUTH_ERROR_CODES.tokenReuseDetected]: {
    message: 'Please sign in again.',
    action: 'signOut',
  },

  [AUTH_ERROR_CODES.sessionNotFound]: { message: 'Please sign in again.', action: 'signOut' },
  [AUTH_ERROR_CODES.sessionExpired]: { message: 'Please sign in again.', action: 'signOut' },
  [AUTH_ERROR_CODES.sessionRevoked]: { message: 'Please sign in again.', action: 'signOut' },

  // ── One-time codes ────────────────────────────────────────────────
  [AUTH_ERROR_CODES.otpInvalid]: { message: 'That code is not correct.', action: 'none' },
  [AUTH_ERROR_CODES.otpExpired]: {
    message: 'That code has expired. Request a new one.',
    action: 'none',
  },
  [AUTH_ERROR_CODES.otpMaxAttempts]: {
    message: 'Too many incorrect attempts. Request a new code.',
    action: 'none',
  },
  [AUTH_ERROR_CODES.otpResendTooSoon]: {
    message: 'Please wait before requesting another code.',
    action: 'none',
    preferServerMessage: true,
  },

  [AUTH_ERROR_CODES.rateLimited]: {
    message: 'Too many requests. Please wait a moment and try again.',
    action: 'none',
    preferServerMessage: true,
  },

  // ── Authorisation and domain rules ────────────────────────────────
  //
  // The critical property of `PERMISSION_DENIED`: it is *not* session-ending.
  // Being refused one action says nothing about whether you are signed in, so
  // it must never clear tokens or bounce the user to the login screen.
  [AUTH_ERROR_CODES.permissionDenied]: {
    message: 'You do not have permission to do this.',
    action: 'none',
    preferServerMessage: true,
  },
  [AUTH_ERROR_CODES.notFound]: {
    message: 'That record no longer exists.',
    action: 'none',
  },
  [AUTH_ERROR_CODES.conflict]: {
    message: 'That conflicts with an existing record.',
    action: 'none',
    // The server names the clashing field — "Email already in use" beats ours.
    preferServerMessage: true,
  },
  [AUTH_ERROR_CODES.roleAlreadyExists]: {
    message: 'A role with that key already exists.',
    action: 'field',
    field: 'key',
  },
  [AUTH_ERROR_CODES.systemRoleProtected]: {
    message: 'Built-in roles cannot be deleted. Deactivate it instead.',
    action: 'none',
  },
  [AUTH_ERROR_CODES.roleHierarchyCycle]: {
    message: 'That parent would create a loop in the role hierarchy.',
    action: 'field',
    field: 'parentId',
  },
  // Always verbatim: the server has already written a specific, human
  // explanation of the rule that was broken. Ours could only be vaguer.
  [AUTH_ERROR_CODES.businessRuleViolation]: {
    message: 'That action is not allowed.',
    action: 'none',
    preferServerMessage: true,
  },
}

/**
 * Codes that mean the session is unrecoverable.
 *
 * The refresh interceptor consults this to decide between retrying a request
 * and giving up: anything here cannot be fixed by another refresh.
 */
export const SESSION_ENDING_CODES: ReadonlySet<string> = new Set([
  AUTH_ERROR_CODES.tokenInvalid,
  AUTH_ERROR_CODES.tokenExpired,
  AUTH_ERROR_CODES.tokenUsed,
  AUTH_ERROR_CODES.tokenRevoked,
  AUTH_ERROR_CODES.tokenReuseDetected,
  AUTH_ERROR_CODES.sessionNotFound,
  AUTH_ERROR_CODES.sessionExpired,
  AUTH_ERROR_CODES.sessionRevoked,
])

/**
 * Codes on an authenticated request that a token refresh might fix.
 *
 * `TOKEN_MISSING` is included because a request can race an in-flight refresh
 * and go out before the new access token has landed.
 */
export const REFRESHABLE_CODES: ReadonlySet<string> = new Set([
  AUTH_ERROR_CODES.tokenExpired,
  AUTH_ERROR_CODES.tokenMissing,
])

export function authErrorMeta(code: string | undefined): AuthErrorMeta | undefined {
  return code ? AUTH_ERROR_META[code] : undefined
}
