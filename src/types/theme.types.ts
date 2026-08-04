/** What the user picked. `system` follows the OS preference. */
export type ThemeMode = 'light' | 'dark' | 'system'

/** What is actually painted after `system` has been resolved. */
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  /** The stored preference. */
  theme: ThemeMode
  /** The preference after resolving `system`. */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemeMode) => void
  /** Flip between light and dark, ignoring `system`. */
  toggleTheme: () => void
}
