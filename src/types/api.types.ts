/**
 * Transport-level contracts.
 *
 * These describe the *shape* of API traffic, not any particular resource.
 * Modules extend them with their own payload types.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Envelope every endpoint returns on success. */
export interface ApiResponse<TData = unknown> {
  success: true
  message?: string
  data: TData
  /** Present on list endpoints only. */
  pagination?: PaginationMeta
  /** Correlates a response with the server's logs — surfaced on failures. */
  requestId?: string
  timestamp?: string
}

/** One field-level failure inside a 422 `error.details`. */
export interface ApiErrorDetail {
  field?: string
  message: string
  /** Present on `OTP_RESEND_TOO_SOON`; drives the resend countdown. */
  retryAfterSeconds?: number
}

/** Envelope every endpoint returns on any 4xx/5xx. */
export interface ApiErrorEnvelope {
  success: false
  message: string
  error: {
    /**
     * Machine-readable and stable. **Branch on this, never on `message`** —
     * message copy is free to change server-side at any time.
     */
    code: string
    details?: ApiErrorDetail[]
  }
  requestId?: string
  timestamp?: string
}

/**
 * Paging metadata.
 *
 * Sent as a **sibling of `data`** in the envelope, not inside it, so the client
 * lifts it out separately — see `httpClient.list`.
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** A list response, recombined from the envelope's `data` + `pagination`. */
export interface PaginatedResponse<TItem> {
  items: TItem[]
  pagination: PaginationMeta
}

/**
 * Query params every list endpoint accepts.
 *
 * The index signature carries filters as **top-level** params — this API takes
 * `?status=ACTIVE,PENDING`, not a nested `filters[status]`.
 */
export interface ListQueryParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
  [param: string]: unknown
}

/** Field-level validation failures, keyed by field name. */
export type FieldErrors = Record<string, string[]>

/** Options accepted by the http client on top of the native `fetch` init. */
export interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  /** Serialised into the query string; `undefined` values are dropped. */
  params?: Record<string, unknown>
  /** Skip attaching the auth header for this call. */
  skipAuth?: boolean
  /** Per-request timeout in milliseconds. */
  timeout?: number
}
