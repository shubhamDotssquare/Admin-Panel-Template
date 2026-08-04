/**
 * Locale-aware formatters built on `Intl`.
 *
 * Pass `locale` explicitly once i18n lands; the browser default is used until
 * then.
 */

type DateInput = Date | string | number

function toDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
  locale?: string,
): string {
  const date = toDate(value)
  return date ? new Intl.DateTimeFormat(locale, options).format(date) : '—'
}

export function formatDateTime(value: DateInput, locale?: string): string {
  return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' }, locale)
}

/** "3 days ago", "in 2 hours". */
export function formatRelativeTime(
  value: DateInput,
  now = new Date(),
  locale?: string,
): string {
  const date = toDate(value)
  if (!date) return '—'

  const diffSeconds = (date.getTime() - now.getTime()) / 1000
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ]

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds || unit === 'second') {
      return formatter.format(Math.round(diffSeconds / seconds), unit)
    }
  }

  return formatter.format(0, 'second')
}

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale?: string,
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

/** 12_400 → "12.4K" */
export function formatCompactNumber(value: number, locale?: string): string {
  return formatNumber(value, { notation: 'compact', maximumFractionDigits: 1 }, locale)
}

export function formatCurrency(value: number, currency = 'USD', locale?: string): string {
  return formatNumber(value, { style: 'currency', currency }, locale)
}

/** `0.128` → "12.8%" */
export function formatPercent(ratio: number, fractionDigits = 1, locale?: string): string {
  return formatNumber(
    ratio,
    { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: fractionDigits },
    locale,
  )
}

export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (bytes <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / 1024 ** exponent

  return `${size.toFixed(exponent === 0 ? 0 : fractionDigits)} ${units[exponent]}`
}
