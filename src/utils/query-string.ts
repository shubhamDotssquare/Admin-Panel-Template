/** Query-string helpers shared by the http client and list views. */

/**
 * Serialise a params object, dropping `undefined`/`null`/`''` and expanding
 * arrays into repeated keys (`tags=a&tags=b`).
 */
export function buildQueryString(params: Record<string, unknown> | undefined): string {
  if (!params) return ''

  const search = new URLSearchParams()

  const append = (key: string, value: unknown): void => {
    if (value === undefined || value === null || value === '') return

    if (Array.isArray(value)) {
      value.forEach((entry) => append(key, entry))
      return
    }

    if (typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) =>
        append(`${key}[${childKey}]`, childValue),
      )
      return
    }

    search.append(key, String(value))
  }

  Object.entries(params).forEach(([key, value]) => append(key, value))

  const serialised = search.toString()
  return serialised ? `?${serialised}` : ''
}

/** Read a `URLSearchParams` into a flat object. */
export function parseQueryString(search: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(search))
}
