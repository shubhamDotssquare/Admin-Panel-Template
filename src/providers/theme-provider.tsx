import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { themeConfig } from '@/config/theme.config'
import { MEDIA_QUERIES } from '@/constants/ui'
import type { ResolvedTheme, ThemeContextValue, ThemeMode } from '@/types/theme.types'
import { getStorageItem, setStorageItem } from '@/utils/storage'

export const ThemeContext = createContext<ThemeContextValue | null>(null)

function prefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MEDIA_QUERIES.prefersDark).matches
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return prefersDark() ? 'dark' : 'light'
  return mode
}

/** Paint the resolved theme onto `<html>`. */
function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement
  root.classList.toggle(themeConfig.darkClass, resolved === 'dark')
  root.style.colorScheme = resolved
}

interface ThemeProviderProps {
  children: React.ReactNode
  /** Overrides the configured default; useful in tests and Storybook. */
  defaultTheme?: ThemeMode
}

/**
 * Owns the light/dark preference: reads it from storage, resolves `system`
 * against the OS, keeps `<html>` in sync, and persists changes.
 */
export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    getStorageItem<ThemeMode>(themeConfig.storageKey, defaultTheme ?? themeConfig.defaultTheme),
  )
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(theme))

  // Apply on mount and whenever the preference changes.
  useEffect(() => {
    const next = resolve(theme)
    setResolvedTheme(next)

    if (!themeConfig.disableTransitionOnChange) {
      applyTheme(next)
      return
    }

    // Suppress transitions for one frame so colours swap instantly.
    const style = document.createElement('style')
    style.append(document.createTextNode('*,*::before,*::after{transition:none !important}'))
    document.head.appendChild(style)

    applyTheme(next)

    const frame = window.requestAnimationFrame(() => style.remove())
    return () => {
      window.cancelAnimationFrame(frame)
      style.remove()
    }
  }, [theme])

  // Follow the OS while the preference is `system`.
  useEffect(() => {
    if (theme !== 'system') return

    const query = window.matchMedia(MEDIA_QUERIES.prefersDark)
    const handleChange = (event: MediaQueryListEvent): void => {
      const next: ResolvedTheme = event.matches ? 'dark' : 'light'
      setResolvedTheme(next)
      applyTheme(next)
    }

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next)
    setStorageItem(themeConfig.storageKey, next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolve(theme) === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
