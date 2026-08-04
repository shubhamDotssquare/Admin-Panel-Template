import { useContext } from 'react'

import { ThemeContext } from '@/providers/theme-provider'
import type { ThemeContextValue } from '@/types/theme.types'

/** Read and change the active theme. Must be used under `ThemeProvider`. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>.')
  }

  return context
}
