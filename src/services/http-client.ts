import { appConfig } from '@/config/app.config'
import {
  CONTENT_TYPE,
  HTTP_STATUS,
  NETWORK_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
} from '@/constants/http'
import type { ApiErrorPayload, HttpMethod, RequestOptions } from '@/types/api.types'
import { buildQueryString } from '@/utils/query-string'
import { ApiError } from './api-error'

/** Called before each request to obtain the bearer token, if any. */
type TokenResolver = () => string | null

/** Called whenever the server rejects the current credentials. */
type UnauthorizedHandler = () => void

let resolveToken: TokenResolver = () => null
let onUnauthorized: UnauthorizedHandler | null = null

/**
 * Wire the client to the app's session handling.
 *
 * Kept as injection points rather than imports so the transport layer has no
 * dependency on any auth implementation.
 */
export function configureHttpClient(options: {
  getToken?: TokenResolver
  onUnauthorized?: UnauthorizedHandler
}): void {
  if (options.getToken) resolveToken = options.getToken
  if (options.onUnauthorized) onUnauthorized = options.onUnauthorized
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

function toApiError(status: number, payload: unknown): ApiError {
  const body = (payload ?? {}) as Partial<ApiErrorPayload>

  return new ApiError({
    message: typeof body.message === 'string' ? body.message : undefined,
    status,
    code: body.code,
    fieldErrors: body.errors,
    payload,
  })
}

async function request<TResponse>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<TResponse> {
  const {
    params,
    skipAuth,
    timeout = appConfig.api.timeout,
    headers,
    signal,
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

  if (!response.ok) {
    if (response.status === HTTP_STATUS.unauthorized) onUnauthorized?.()
    throw toApiError(response.status, payload)
  }

  return payload as TResponse
}

/**
 * Thin, typed `fetch` wrapper: base URL, auth header, query serialisation,
 * timeouts and uniform errors. Deliberately dependency-free.
 */
export const httpClient = {
  get: <TResponse>(path: string, options?: RequestOptions) =>
    request<TResponse>('GET', path, undefined, options),

  post: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
    request<TResponse>('POST', path, body, options),

  put: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
    request<TResponse>('PUT', path, body, options),

  patch: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
    request<TResponse>('PATCH', path, body, options),

  delete: <TResponse>(path: string, options?: RequestOptions) =>
    request<TResponse>('DELETE', path, undefined, options),
}

export type HttpClient = typeof httpClient
