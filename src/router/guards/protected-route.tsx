import { Navigate, Outlet, useLocation } from 'react-router'

import { LoadingScreen } from '@/components/common/loading-screen'
import { appConfig } from '@/config/app.config'
import { useAuth } from '@/hooks/use-auth'

/**
 * Gate for the authenticated shell.
 *
 * Inert while `appConfig.auth.enabled` is false, so the template runs without a
 * backend. Once enabled, unauthenticated visitors are redirected to the login
 * path with a `redirectTo` param carrying their original destination.
 *
 * The `loading` state is load-bearing: on a hard refresh a token exists before
 * the user has been resolved, and redirecting during that window would sign
 * people out on every page load.
 */
export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  if (!appConfig.auth.enabled) {
    return children ? <>{children}</> : <Outlet />
  }

  if (isLoading) {
    return (
      <div className="grid min-h-svh place-items-center">
        <LoadingScreen label="Restoring your session…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`
    const target = `${appConfig.loginPath}?${appConfig.auth.redirectParam}=${encodeURIComponent(from)}`

    return <Navigate to={target} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
