import { Suspense } from 'react'
import { Outlet } from 'react-router'

import { LoadingScreen } from '@/components/common/loading-screen'
import { AppBrand } from '@/components/layout/app-brand'
import { ThemeToggle } from '@/components/layout/theme-toggle'

/**
 * Centred, chrome-free shell for sign-in and password recovery screens.
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex h-header shrink-0 items-center justify-between px-4">
        <AppBrand />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center p-content">
        <div className="w-full max-w-sm">
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
