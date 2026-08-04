import { useContext } from 'react'

import { LayoutContext, type LayoutContextValue } from '@/providers/layout-provider'

/** Access shell chrome state. Must be used under `LayoutProvider`. */
export function useLayout(): LayoutContextValue {
  const context = useContext(LayoutContext)

  if (!context) {
    throw new Error('useLayout must be used within a <LayoutProvider>.')
  }

  return context
}
