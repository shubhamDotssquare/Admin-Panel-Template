import { createContext, useMemo, useState } from 'react'

import type { BreadcrumbItem } from '@/types/navigation.types'

export interface BreadcrumbContextValue {
  /** `null` means "no override" — the header derives the trail from the URL. */
  items: BreadcrumbItem[] | null
  setItems: (items: BreadcrumbItem[] | null) => void
}

export const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

/**
 * Lets a screen replace the auto-derived breadcrumb trail.
 *
 * The header can only guess labels from the URL, which reads badly for dynamic
 * segments (`/users/42` → "42"). A page that knows the record calls
 * `useSetBreadcrumbs` to publish the real trail; everything else keeps the
 * derived one for free.
 */
export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[] | null>(null)

  const value = useMemo<BreadcrumbContextValue>(() => ({ items, setItems }), [items])

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
}
