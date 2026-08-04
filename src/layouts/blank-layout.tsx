import { Suspense } from 'react'
import { Outlet } from 'react-router'

import { LoadingScreen } from '@/components/common/loading-screen'

/**
 * No chrome at all — for error pages, print views and embedded screens.
 */
export function BlankLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    </div>
  )
}
