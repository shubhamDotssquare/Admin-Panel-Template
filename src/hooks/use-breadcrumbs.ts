import { useContext, useEffect } from 'react'

import { BreadcrumbContext, type BreadcrumbContextValue } from '@/providers/breadcrumb-provider'
import type { BreadcrumbItem } from '@/types/navigation.types'

/** Read the breadcrumb override. Must be used under `BreadcrumbProvider`. */
export function useBreadcrumbs(): BreadcrumbContextValue {
  const context = useContext(BreadcrumbContext)

  if (!context) {
    throw new Error('useBreadcrumbs must be used within a <BreadcrumbProvider>.')
  }

  return context
}

/**
 * Publish a breadcrumb trail for the current screen, clearing it on unmount.
 *
 * ```tsx
 * useSetBreadcrumbs([
 *   { label: 'Users', path: PATHS.userManager },
 *   { label: user.name },
 * ])
 * ```
 *
 * Callers do not need to memoise the array: the trail is compared by value, so
 * a fresh literal on every render is fine.
 */
export function useSetBreadcrumbs(items: BreadcrumbItem[] | null): void {
  const { setItems } = useBreadcrumbs()

  // Comparing the serialised trail keeps an inline array from looping, which a
  // reference-identity dependency would do on every render.
  const key = items ? JSON.stringify(items) : null

  useEffect(() => {
    setItems(key ? (JSON.parse(key) as BreadcrumbItem[]) : null)

    return () => setItems(null)
  }, [key, setItems])
}
