/**
 * The only place `import.meta.env` is read.
 *
 * Values are parsed and defaulted once here so the rest of the app consumes a
 * plain, typed object and never has to think about string coercion.
 */

function readString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback
  return value.trim().toLowerCase() === 'true'
}

export const env = {
  appName: readString(import.meta.env.VITE_APP_NAME, 'Admin Panel'),
  appShortName: readString(import.meta.env.VITE_APP_SHORT_NAME, 'AP'),
  apiBaseUrl: readString(import.meta.env.VITE_API_BASE_URL, 'http://localhost:4000/api/v1'),
  apiTimeout: readNumber(import.meta.env.VITE_API_TIMEOUT, 30_000),
  authEnabled: readBoolean(import.meta.env.VITE_AUTH_ENABLED, false),
  defaultTheme: readString(import.meta.env.VITE_DEFAULT_THEME, 'system'),
  supportEmail: readString(import.meta.env.VITE_SUPPORT_EMAIL, ''),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const

export type Env = typeof env
