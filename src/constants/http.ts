/** HTTP status codes the app branches on. */
export const HTTP_STATUS = {
  ok: 200,
  created: 201,
  noContent: 204,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  unprocessableEntity: 422,
  tooManyRequests: 429,
  serverError: 500,
  serviceUnavailable: 503,
} as const

export const CONTENT_TYPE = {
  json: 'application/json',
  formData: 'multipart/form-data',
  urlEncoded: 'application/x-www-form-urlencoded',
} as const

/** Fallback copy for failures that carry no server message. */
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'The request was invalid.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource could not be found.',
  409: 'This action conflicts with the current state.',
  422: 'Please correct the highlighted fields and try again.',
  429: 'Too many requests. Please slow down and retry shortly.',
  500: 'Something went wrong on our side. Please try again.',
  503: 'The service is temporarily unavailable.',
}

export const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred.'
export const NETWORK_ERROR_MESSAGE =
  'Unable to reach the server. Check your connection and try again.'
export const TIMEOUT_ERROR_MESSAGE = 'The request took too long and was cancelled.'
