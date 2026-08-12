import { useCallback, useMemo } from 'react'

import { useAuth } from './use-auth'

export type PermissionMode = 'all' | 'any'

/**
 * Check whether the current user holds one or more permissions.
 *
 * ```tsx
 * const canEdit = usePermission('users.edit')
 * const canManage = usePermission(['users.edit', 'users.delete'])          // all
 * const canSeeBilling = usePermission(['billing.view', 'admin'], 'any')    // either
 * ```
 *
 * **This is presentation only.** The backend has no RBAC yet, so `can()` allows
 * everything and this hook currently returns true. Use it to tidy the UI — hide
 * a button that would only fail — never as the sole guard on a sensitive action.
 * Real enforcement has to live on the server; when it lands, this hook and
 * `PermissionRoute` are the two places that start returning false.
 */
export function usePermission(
  permission: string | string[],
  mode: PermissionMode = 'all',
): boolean {
  const { can } = useAuth()

  return useMemo(() => {
    const keys = typeof permission === 'string' ? [permission] : permission

    // No requirement means nothing to withhold.
    if (keys.length === 0) return true

    return mode === 'any' ? keys.some((key) => can(key)) : keys.every((key) => can(key))
  }, [can, mode, permission])
}

/**
 * The imperative form, for checks inside callbacks and loops where a hook
 * cannot be called — per-row actions in a table, say.
 */
export function usePermissionCheck(): (
  permission: string | string[],
  mode?: PermissionMode,
) => boolean {
  const { can } = useAuth()

  return useCallback(
    (permission, mode: PermissionMode = 'all') => {
      const keys = typeof permission === 'string' ? [permission] : permission
      if (keys.length === 0) return true

      return mode === 'any' ? keys.some((key) => can(key)) : keys.every((key) => can(key))
    },
    [can],
  )
}
