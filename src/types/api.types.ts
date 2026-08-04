/**
 * Transport-level contracts.
 *
 * These describe the *shape* of API traffic, not any particular resource.
 * Modules extend them with their own payload types.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Envelope every endpoint is expected to return. */
export interface ApiResponse<TData = unknown> {
  success: boolean
  message?: string
  data: TData
}

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<TItem> {
  items: TItem[]
  meta: PaginationMeta
}

/** Query params accepted by any list endpoint. */
export interface ListQueryParams {
  page?: number
  perPage?: number
  search?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  filters?: Record<string, string | number | boolean | undefined>
}

/** Field-level validation failures, keyed by field name. */
export type FieldErrors = Record<string, string[]>

export interface ApiErrorPayload {
  message: string
  code?: string
  errors?: FieldErrors
}

/** Options accepted by the http client on top of the native `fetch` init. */
export interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  /** Serialised into the query string; `undefined` values are dropped. */
  params?: Record<string, unknown>
  /** Skip attaching the auth header for this call. */
  skipAuth?: boolean
  /** Per-request timeout in milliseconds. */
  timeout?: number
}
