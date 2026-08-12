import { SESSION_ENDING_CODES } from '@/constants/auth-errors'
import { DEFAULT_ERROR_MESSAGE, HTTP_ERROR_MESSAGES, HTTP_STATUS } from '@/constants/http'
import type { ApiErrorDetail, FieldErrors } from '@/types/api.types'

/**
 * The single error type the http client throws.
 *
 * UI code can branch on `status`, `isUnauthorized`, `isValidation`, … instead
 * of inspecting raw responses.
 */
export class ApiError extends Error {
  readonly status: number
  /** Machine-readable and stable. Branch on this, never on `message`. */
  readonly code?: string
  readonly fieldErrors?: FieldErrors
  /** Raw `error.details`, for the few cases needing more than a message. */
  readonly details?: ApiErrorDetail[]
  /** Server correlation id — worth showing on unexpected failures. */
  readonly requestId?: string
  readonly payload?: unknown

  constructor(options: {
    message?: string
    status: number
    code?: string
    fieldErrors?: FieldErrors
    details?: ApiErrorDetail[]
    requestId?: string
    payload?: unknown
  }) {
    super(options.message ?? HTTP_ERROR_MESSAGES[options.status] ?? DEFAULT_ERROR_MESSAGE)

    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.fieldErrors = options.fieldErrors
    this.details = options.details
    this.requestId = options.requestId
    this.payload = options.payload
  }

  /** Seconds to wait before retrying, when the server supplied a cooldown. */
  get retryAfterSeconds(): number | undefined {
    return this.details?.find((d) => d.retryAfterSeconds !== undefined)?.retryAfterSeconds
  }

  get isUnauthorized(): boolean {
    return this.status === HTTP_STATUS.unauthorized
  }

  get isForbidden(): boolean {
    return this.status === HTTP_STATUS.forbidden
  }

  get isNotFound(): boolean {
    return this.status === HTTP_STATUS.notFound
  }

  get isValidation(): boolean {
    return this.status === HTTP_STATUS.unprocessableEntity || Boolean(this.fieldErrors)
  }

  /** `status: 0` is reserved for network/timeout failures. */
  get isNetwork(): boolean {
    return this.status === 0
  }

  /**
   * The session is gone for good — another refresh cannot rescue it.
   *
   * Callers should clear tokens and return the user to sign-in rather than retry.
   */
  get isSessionEnding(): boolean {
    return Boolean(this.code && SESSION_ENDING_CODES.has(this.code))
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** Best-effort message extraction for anything thrown anywhere. */
export function toErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return DEFAULT_ERROR_MESSAGE
}
