import { Navigate, Outlet, useSearchParams } from 'react-router'

import { appConfig } from '@/config/app.config'
import { sessionService } from '@/services/session.service'

/**
 * Inverse of `ProtectedRoute`: keeps signed-in users off the auth screens,
 * honouring the `redirectTo` param they arrived with.
 */
export function GuestRoute({ children }: { children?: React.ReactNode }) {
  const [searchParams] = useSearchParams()

  if (appConfig.auth.enabled && sessionService.hasSession()) {
    const redirectTo = searchParams.get(appConfig.auth.redirectParam)
    return <Navigate to={redirectTo ?? appConfig.homePath} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
