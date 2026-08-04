import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { appConfig } from '@/config/app.config'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { useIsMobile } from '@/hooks/use-media-query'
import { useLocalStorage } from '@/hooks/use-local-storage'

export interface LayoutContextValue {
  /** Desktop: sidebar rendered in its narrow, icon-only form. */
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  /** Mobile: off-canvas sidebar sheet is open. */
  isMobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  /** Viewport is below the `lg` breakpoint. */
  isMobile: boolean
}

export const LayoutContext = createContext<LayoutContextValue | null>(null)

/**
 * Shell chrome state, shared by the header, sidebar and mobile drawer.
 *
 * The collapsed preference persists; the mobile drawer never does.
 */
export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  // Explicit generic: `appConfig` is `as const`, so the default would otherwise
  // narrow the state to the literal `false`.
  const [isSidebarCollapsed, setCollapsed] = useLocalStorage<boolean>(
    STORAGE_KEYS.sidebarCollapsed,
    appConfig.layout.defaultSidebarCollapsed,
  )
  const [isMobileNavOpen, setMobileNavOpen] = useState(false)

  // Leaving mobile should not leave a stale drawer behind.
  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false)
  }, [isMobile])

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileNavOpen((previous) => !previous)
      return
    }
    setCollapsed((previous) => !previous)
  }, [isMobile, setCollapsed])

  const setSidebarCollapsed = useCallback(
    (collapsed: boolean) => setCollapsed(collapsed),
    [setCollapsed],
  )

  const value = useMemo<LayoutContextValue>(
    () => ({
      isSidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      isMobileNavOpen,
      setMobileNavOpen,
      isMobile,
    }),
    [isSidebarCollapsed, toggleSidebar, setSidebarCollapsed, isMobileNavOpen, isMobile],
  )

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}
