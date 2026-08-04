import { DEFAULT_ERROR_MESSAGE, HTTP_ERROR_MESSAGES, HTTP_STATUS } from '@/constants/http'
import type { FieldErrors } from '@/types/api.types'

/**
 * The single error type the http client throws.
 *
 * UI code can branch on `status`, `isUnauthorized`, `isValidation`, … instead
 * of inspecting raw responses.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly fieldErrors?: FieldErrors
  readonly payload?: unknown

  constructor(options: {
    message?: string
    status: number
    code?: string
    fieldErrors?: FieldErrors
    payload?: unknown
  }) {
    super(options.message ?? HTTP_ERROR_MESSAGES[options.status] ?? DEFAULT_ERROR_MESSAGE)

    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.fieldErrors = options.fieldErrors
    this.payload = options.payload
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
