import { Suspense } from 'react'
import { Outlet } from 'react-router'

import { ErrorBoundary } from '@/components/common/error-boundary'
import { LoadingScreen } from '@/components/common/loading-screen'
import { AppHeader, type AppHeaderProps } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { useLayout } from '@/hooks/use-layout'
import type { NavGroup } from '@/types/navigation.types'
import { cn } from '@/utils/cn'

/** Everything the shell renders but does not own. */
export interface AdminLayoutProps extends AppHeaderProps {
  /** Override the sidebar navigation; defaults to the app-wide config. */
  groups?: NavGroup[]
}

/**
 * The authenticated shell: sidebar, header, and a scrolling content region.
 *
 * Module routes mount into the `<Outlet />`, each wrapped in its own error
 * boundary and Suspense fence so a single failing screen stays contained.
 *
 * Session-shaped props (`user`, `onSignOut`, `notifications`) are forwarded to
 * the header rather than read from a context, so the shell stays free of
 * authentication and data-fetching concerns.
 */
export function AdminLayout({ groups, ...header }: AdminLayoutProps = {}) {
  const { isSidebarCollapsed, isMobile } = useLayout()

  return (
    <div className="min-h-svh bg-background">
      <AppSidebar groups={groups} />

      <div
        className={cn(
          'flex min-h-svh flex-col transition-[padding] duration-200 ease-out',
          !isMobile && (isSidebarCollapsed ? 'pl-sidebar-collapsed' : 'pl-sidebar'),
        )}
      >
        <AppHeader {...header} />

        <main className="flex flex-1 flex-col">
          <ErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
