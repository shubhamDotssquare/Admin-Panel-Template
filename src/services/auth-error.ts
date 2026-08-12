import { authErrorMeta, type AuthErrorAction } from '@/constants/auth-errors'
import type { FieldErrors } from '@/types/api.types'
import { isApiError, toErrorMessage } from './api-error'

export interface ResolvedAuthError {
  code?: string
  /** Ready to show. Already reconciled between our copy and the server's. */
  message: string
  action: AuthErrorAction
  /** Field the message belongs on, when `action` is `'field'`. */
  field?: string
  /** Per-field messages from a 422 `error.details`. */
  fieldErrors?: FieldErrors
  /** Cooldown from the server, for disabling a resend button. */
  retryAfterSeconds?: number
}

/**
 * Turn anything thrown by the API into copy plus a UI action.
 *
 * The point is that screens never grow a `switch` over error codes: they render
 * `message`, and react to `action` if they support it. Adding a new code means
 * one entry in [`auth-errors.ts`](../constants/auth-errors.ts) and no page edits.
 *
 * Copy precedence is deliberate. Our own message wins by default — server copy
 * is written for API consumers, not end users — except where the server knows
 * something we cannot state in advance (a lockout countdown, a rate-limit
 * window), which `preferServerMessage` marks.
 */
export function resolveAuthError(error: unknown): ResolvedAuthError {
  if (!isApiError(error)) {
    return { message: toErrorMessage(error), action: 'none' }
  }

  const meta = authErrorMeta(error.code)

  let message: string
  if (!meta) {
    message = error.message
  } else if (meta.preferServerMessage && error.message) {
    message = error.message
  } else {
    message = meta.message
  }

  // A code whose action is `field` names the input it belongs on, but only a 422
  // carries `error.details`. Synthesising the entry here means a 409 like
  // EMAIL_ALREADY_REGISTERED lands on the email input rather than in the banner,
  // with no per-page handling.
  let fieldErrors = error.fieldErrors
  if (!fieldErrors && meta?.action === 'field' && meta.field) {
    fieldErrors = { [meta.field]: [message] }
  }

  return {
    code: error.code,
    message,
    action: meta?.action ?? 'none',
    field: meta?.field,
    fieldErrors,
    retryAfterSeconds: error.retryAfterSeconds,
  }
}
