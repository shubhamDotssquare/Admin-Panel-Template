import { Navigate, Outlet, useLocation } from 'react-router'

import { appConfig } from '@/config/app.config'
import { sessionService } from '@/services/session.service'

/**
 * Gate for the authenticated shell.
 *
 * Inert while `appConfig.auth.enabled` is false, so the template runs without a
 * backend. Once enabled, unauthenticated visitors are redirected to the login
 * path with a `redirectTo` param carrying their original destination.
 *
 * Swap `sessionService.hasSession()` for a real session hook when the auth
 * module lands — this is the only place that needs to change.
 */
export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const location = useLocation()

  if (appConfig.auth.enabled && !sessionService.hasSession()) {
    const from = `${location.pathname}${location.search}`
    const target = `${appConfig.loginPath}?${appConfig.auth.redirectParam}=${encodeURIComponent(from)}`

    return <Navigate to={target} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
