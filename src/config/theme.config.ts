import { STORAGE_KEYS } from '@/constants/storage-keys'
import type { ThemeMode } from '@/types/theme.types'
import { env } from './env'

const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system']

function isThemeMode(value: string): value is ThemeMode {
  return (THEME_MODES as readonly string[]).includes(value)
}

export const themeConfig = {
  /** Preference used before the user chooses one. */
  defaultTheme: (isThemeMode(env.defaultTheme) ? env.defaultTheme : 'system') as ThemeMode,
  /** Where the preference is persisted. */
  storageKey: STORAGE_KEYS.theme,
  /** Class toggled on `<html>`; must match the `dark` variant in globals.css. */
  darkClass: 'dark',
  /** Modes offered in the theme switcher, in order. */
  availableModes: THEME_MODES,
  /** Suppress transitions during a theme change to avoid a colour smear. */
  disableTransitionOnChange: true,
} as const

export { isThemeMode }
