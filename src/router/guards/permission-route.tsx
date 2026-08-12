import { Navigate, Outlet } from 'react-router'

import { useAuth } from '@/hooks/use-auth'
import { PATHS } from '@/router/paths'

interface PermissionRouteProps {
  /**
   * Permission key(s) resolved against the signed-in user. All must be held.
   * Ignored when `allowed` is given.
   */
  permission?: string | string[]
  /**
   * Pre-computed decision, for modules whose rules are richer than a key lookup
   * (ownership, record state, feature flags).
   */
  allowed?: boolean
  redirectTo?: string
  children?: React.ReactNode
}

/**
 * Permission gate for module routes.
 *
 * Two ways to use it. Either name the permission and let auth state answer:
 *
 * ```tsx
 * { element: <PermissionRoute permission="users.view" />, children: [...] }
 * ```
 *
 * …or decide yourself and pass the verdict, for rules a key cannot express:
 *
 * ```tsx
 * { element: <PermissionRoute allowed={isOwner && record.isDraft} />, children: [...] }
 * ```
 *
 * `can()` returns true for everything while auth is disabled, so permission-gated
 * routes stay reachable in the template's default state.
 */
export function PermissionRoute({
  permission,
  allowed,
  redirectTo = PATHS.forbidden,
  children,
}: PermissionRouteProps) {
  const { can } = useAuth()

  const keys = typeof permission === 'string' ? [permission] : (permission ?? [])
  const isAllowed = allowed ?? keys.every(can)

  if (!isAllowed) return <Navigate to={redirectTo} replace />
  return children ? <>{children}</> : <Outlet />
}
