import { Navigate, Outlet } from 'react-router'

import { PATHS } from '@/router/paths'

/**
 * Permission gate for module routes.
 *
 * Permission *evaluation* belongs to the Admin Manager module, so this
 * component takes the decision as a prop rather than reaching for a store:
 *
 * ```tsx
 * { element: <PermissionRoute allowed={can('users.view')} />, children: [...] }
 * ```
 */
export function PermissionRoute({
  allowed,
  redirectTo = PATHS.forbidden,
  children,
}: {
  allowed: boolean
  redirectTo?: string
  children?: React.ReactNode
}) {
  if (!allowed) return <Navigate to={redirectTo} replace />
  return children ? <>{children}</> : <Outlet />
}
