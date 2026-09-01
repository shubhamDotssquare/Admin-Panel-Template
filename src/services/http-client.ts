import { appConfig } from '@/config/app.config'
import { REFRESHABLE_CODES } from '@/constants/auth-errors'
import {
  CONTENT_TYPE,
  HTTP_STATUS,
  NETWORK_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
} from '@/constants/http'
import type {
  ApiErrorDetail,
  ApiErrorEnvelope,
  FieldErrors,
  HttpMethod,
  PaginatedResponse,
  RequestOptions,
} from '@/types/api.types'
import { buildQueryString } from '@/utils/query-string'
import { ApiError } from './api-error'

/** Obtains the current access token, if one is held. */
type TokenResolver = () => string | null

/**
 * Exchanges the stored refresh token for a new pair.
 *
 * Resolves true when a fresh access token is available to retry with.
 */
type TokenRefresher = () => Promise<boolean>

/** Called when the session is unrecoverable and the app must sign out. */
type UnauthorizedHandler = () => void

let resolveToken: TokenResolver = () => null
let refreshTokens: TokenRefresher | null = null
let onUnauthorized: UnauthorizedHandler | null = null

/**
 * Wire the client to the app's session handling.
 *
 * Kept as injection points rather than imports so the transport layer has no
 * dependency on any auth implementation.
 */
export function configureHttpClient(options: {
  getToken?: TokenResolver
  refresh?: TokenRefresher
  onUnauthorized?: UnauthorizedHandler
}): void {
  if (options.getToken) resolveToken = options.getToken
  if (options.refresh) refreshTokens = options.refresh
  if (options.onUnauthorized) onUnauthorized = options.onUnauthorized
}

/**
 * The in-flight refresh, shared by every request that needs one.
 *
 * This is load-bearing, not an optimisation. Refresh tokens are single-use: two
 * concurrent 401s that each POST `/auth/refresh` would send the same token
 * twice, and the server reads the second as token reuse and revokes the whole
 * session. Every caller must await the *same* refresh.
 */
let refreshInFlight: Promise<boolean> | null = null

function refreshOnce(): Promise<boolean> {
  refreshInFlight ??= (refreshTokens?.() ?? Promise.resolve(false)).finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const isAbsolute = /^https?:\/\//i.test(path)
  const base = appConfig.api.baseUrl.replace(/\/+$/, '')
  const normalisedPath = path.startsWith('/') ? path : `/${path}`

  return `${isAbsolute ? '' : base}${isAbsolute ? path : normalisedPath}${buildQueryString(params)}`
}

function isFormLike(body: unknown): boolean {
  return (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer
  )
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === HTTP_STATUS.noContent) return null

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  const text = await response.text()
  return text === '' ? null : text
}

/** `[{ field: 'email', message: '…' }]` → `{ email: ['…'] }` for form binding. */
function toFieldErrors(details: ApiErrorDetail[] | undefined): FieldErrors | undefined {
  if (!details?.length) return undefined

  const mapped: FieldErrors = {}
  for (const detail of details) {
    if (!detail.field || !detail.message) continue
    ;(mapped[detail.field] ??= []).push(detail.message)
  }

  return Object.keys(mapped).length > 0 ? mapped : undefined
}

function toApiError(status: number, payload: unknown): ApiError {
  const body = (payload ?? {}) as Partial<ApiErrorEnvelope>
  const details = body.error?.details

  return new ApiError({
    message: typeof body.message === 'string' ? body.message : undefined,
    status,
    code: body.error?.code,
    fieldErrors: toFieldErrors(details),
    details,
    requestId: body.requestId,
    payload,
  })
}

/**
 * Unwrap the success envelope.
 *
 * Every endpoint answers `{ success, message, data, requestId, timestamp }`, so
 * callers receive `data` and never see the wrapper. A bare body is tolerated for
 * the occasional endpoint that forgets it.
 */
function unwrap<TResponse>(payload: unknown): TResponse {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return (payload as { data: TResponse }).data
  }

  return payload as TResponse
}

interface SendOptions extends RequestOptions {
  /** Guards the retry so one request can never trigger a refresh loop. */
  isRetry?: boolean
  /**
   * Resolve with the whole envelope rather than just `data`.
   *
   * List endpoints put `pagination` beside `data`, so unwrapping to `data`
   * alone would silently drop the page count.
   */
  rawEnvelope?: boolean
}

async function send<TResponse>(
  method: HttpMethod,
  path: string,
  body: unknown,
  options: SendOptions,
): Promise<TResponse> {
  const {
    params,
    skipAuth,
    timeout = appConfig.api.timeout,
    headers,
    signal,
    isRetry,
    rawEnvelope,
    ...init
  } = options

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort('timeout'), timeout)

  // Honour a caller-supplied signal alongside our timeout.
  signal?.addEventListener('abort', () => controller.abort(signal.reason), { once: true })

  const requestHeaders = new Headers(headers)
  const sendsJson = body !== undefined && !isFormLike(body)

  if (sendsJson && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', CONTENT_TYPE.json)
  }
  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', CONTENT_TYPE.json)
  }

  if (!skipAuth) {
    const token = resolveToken()
    if (token) requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, params), {
      ...init,
      method,
      headers: requestHeaders,
      signal: controller.signal,
      body:
        body === undefined ? undefined : sendsJson ? JSON.stringify(body) : (body as BodyInit),
    })
  } catch (error) {
    const aborted = controller.signal.aborted
    throw new ApiError({
      status: 0,
      code: aborted ? 'TIMEOUT' : 'NETWORK',
      message: aborted ? TIMEOUT_ERROR_MESSAGE : NETWORK_ERROR_MESSAGE,
      payload: error,
    })
  } finally {
    window.clearTimeout(timeoutId)
  }

  const payload = await parseBody(response)
  if (response.ok) return rawEnvelope ? (payload as TResponse) : unwrap<TResponse>(payload)

  const error = toApiError(response.status, payload)

  // ── The refresh-on-401 interceptor ───────────────────────────────
  //
  // Only an authenticated call whose failure a *new access token* could fix is
  // worth retrying. A session-ending code (reuse detected, session revoked) is
  // final, and retrying it would burn the refresh token for nothing.
  const canRetry =
    !skipAuth &&
    !isRetry &&
    response.status === HTTP_STATUS.unauthorized &&
    Boolean(error.code && REFRESHABLE_CODES.has(error.code)) &&
    Boolean(refreshTokens)

  if (canRetry) {
    const refreshed = await refreshOnce()

    // Exactly one retry: `isRetry` makes a second failure terminal, so a server
    // that keeps answering 401 cannot spin this forever.
    if (refreshed) return send<TResponse>(method, path, body, { ...options, isRetry: true })
  }

  // Sign out only when the 401 is genuinely about the *session*.
  //
  // Not every 401 is: `/auth/change-password` answers 401 with
  // INVALID_CREDENTIALS when the *current password* is wrong, and treating that
  // as a dead session would sign a user out for a typo. So this fires for
  // session-ending codes, for a token code that survived the retry above, and
  // for a code-less 401 (unknown, so assume the worst) — but never for a
  // business 401 that happens to share the status.
  if (response.status === HTTP_STATUS.unauthorized && !skipAuth) {
    const isSessionFailure =
      error.code === undefined || error.isSessionEnding || REFRESHABLE_CODES.has(error.code)

    if (isSessionFailure) onUnauthorized?.()
  }

  throw error
}

/**
 * Thin, typed `fetch` wrapper: base URL, auth header, query serialisation,
 * timeouts, envelope unwrapping, uniform errors, and transparent token refresh.
 * Deliberately dependency-free.
 */
export const httpClient = {
  get: <TResponse>(path: string, options: RequestOptions = {}) =>
    send<TResponse>('GET', path, undefined, options),

  post: <TResponse>(path: string, body?: unknown, options: RequestOptions = {}) =>
    send<TResponse>('POST', path, body, options),

  put: <TResponse>(path: string, body?: unknown, options: RequestOptions = {}) =>
    send<TResponse>('PUT', path, body, options),

  patch: <TResponse>(path: string, body?: unknown, options: RequestOptions = {}) =>
    send<TResponse>('PATCH', path, body, options),

  delete: <TResponse>(path: string, options: RequestOptions = {}) =>
    send<TResponse>('DELETE', path, undefined, options),

  /**
   * GET a list endpoint, recombining the envelope's `data` and its sibling
   * `pagination` into one object.
   *
   * `pagination` is absent on a non-paginated collection, so a safe default is
   * synthesised from the returned rows — a caller should never have to check
   * whether the server bothered to send it.
   */
  async list<TItem>(
    path: string,
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<TItem>> {
    const envelope = await send<{
      data?: TItem[]
      pagination?: PaginatedResponse<TItem>['pagination']
    }>('GET', path, undefined, { ...options, rawEnvelope: true })

    const items = Array.isArray(envelope?.data) ? envelope.data : []
    const total = envelope?.pagination?.total ?? items.length

    return {
      items,
      pagination: envelope?.pagination ?? {
        page: 1,
        limit: items.length,
        total,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }
  },
}

export type HttpClient = typeof httpClient
