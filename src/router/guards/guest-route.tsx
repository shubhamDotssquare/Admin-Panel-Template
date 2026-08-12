import { Navigate, Outlet, useSearchParams } from 'react-router'

import { LoadingScreen } from '@/components/common/loading-screen'
import { appConfig } from '@/config/app.config'
import { useAuth } from '@/hooks/use-auth'

/**
 * Inverse of `ProtectedRoute`: keeps signed-in users off the auth screens,
 * honouring the `redirectTo` param they arrived with.
 *
 * Bootstrap is held rather than treated as signed-out, so refreshing on `/login`
 * with a live session does not flash the sign-in form before redirecting.
 */
export function GuestRoute({ children }: { children?: React.ReactNode }) {
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading } = useAuth()

  if (!appConfig.auth.enabled) {
    return children ? <>{children}</> : <Outlet />
  }

  if (isLoading) {
    return (
      <div className="grid min-h-svh place-items-center">
        <LoadingScreen label="Checking your session…" />
      </div>
    )
  }

  if (isAuthenticated) {
    const redirectTo = searchParams.get(appConfig.auth.redirectParam)
    return <Navigate to={redirectTo ?? appConfig.homePath} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
