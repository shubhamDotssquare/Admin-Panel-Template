import { Suspense } from 'react'
import { Outlet } from 'react-router'

import { ErrorBoundary } from '@/components/common/error-boundary'
import { LoadingScreen } from '@/components/common/loading-screen'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { useLayout } from '@/hooks/use-layout'
import { cn } from '@/utils/cn'

/**
 * The authenticated shell: sidebar, header, and a scrolling content region.
 *
 * Module routes mount into the `<Outlet />`, each wrapped in its own error
 * boundary and Suspense fence so a single failing screen stays contained.
 */
export function AdminLayout() {
  const { isSidebarCollapsed, isMobile } = useLayout()

  return (
    <div className="min-h-svh bg-background">
      <AppSidebar />

      <div
        className={cn(
          'flex min-h-svh flex-col transition-[padding] duration-200 ease-out',
          !isMobile && (isSidebarCollapsed ? 'pl-sidebar-collapsed' : 'pl-sidebar'),
        )}
      >
        <AppHeader />

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
