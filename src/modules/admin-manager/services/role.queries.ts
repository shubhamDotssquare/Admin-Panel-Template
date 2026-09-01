import { useMutation, useQuery } from '@tanstack/react-query'

import { API_ENDPOINTS } from '@/constants/api-endpoints'
import { createQueryKeys } from '@/lib/query-keys'
import { httpClient } from '@/services/http-client'
import { rbacService } from '@/services/rbac.service'
import type { ListQueryParams } from '@/types/api.types'
import type { CreateRoleDto, UpdateRoleDto } from '@/types/rbac.types'
import type { PermissionRecord } from '../types'

export const roleKeys = createQueryKeys('roles')
export const permissionKeys = createQueryKeys('permissions')

/**
 * Roles are built by hand rather than through `createResourceQueries` because
 * they hang off `/rbac/roles` with their own permission attach/detach verbs —
 * the generic CRUD factory would only cover half of the surface.
 */
export const roles = {
  keys: roleKeys,

  useList: (params?: ListQueryParams) =>
    useQuery({
      queryKey: roleKeys.list(params),
      queryFn: () => rbacService.listRoles(params),
    }),

  useDetail: (id: string | undefined) =>
    useQuery({
      queryKey: roleKeys.detail(id ?? ''),
      queryFn: () => rbacService.getRole(id as string),
      enabled: Boolean(id),
    }),

  useCreate: () =>
    useMutation({
      mutationFn: (payload: CreateRoleDto) => rbacService.createRole(payload),
      meta: { invalidates: [roleKeys.all()] },
    }),

  useUpdate: () =>
    useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateRoleDto }) =>
        rbacService.updateRole(id, payload),
      meta: { invalidates: [roleKeys.all()] },
    }),

  useRemove: () =>
    useMutation({
      mutationFn: (id: string) => rbacService.deleteRole(id),
      meta: { invalidates: [roleKeys.all()] },
    }),

  useAttachPermission: () =>
    useMutation({
      mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
        rbacService.attachPermission(roleId, permissionId),
      meta: { invalidates: [roleKeys.all()] },
    }),

  useDetachPermission: () =>
    useMutation({
      mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
        rbacService.detachPermission(roleId, permissionId),
      meta: { invalidates: [roleKeys.all()] },
    }),
}

/** Seeded reference data — listed for the role editor's permission picker. */
export function usePermissionCatalogue() {
  return useQuery({
    queryKey: permissionKeys.list({ limit: 200 }),
    queryFn: () => rbacService.listPermissions({ limit: 200 }),
  })
}

/**
 * The full permission catalogue, for the read-only permissions list screen.
 *
 * Built by hand rather than through `rbacService.listPermissions` — that
 * method is typed for the flattened `Permission` shape the role editor's
 * picker expects (`resourceName`), while `/rbac/permissions` actually answers
 * with a nested `resource` object. Calling `httpClient.list` directly here
 * keeps that mismatch from leaking into either caller.
 */
export const permissions = {
  keys: permissionKeys,

  useList: (params?: ListQueryParams, options?: { enabled?: boolean }) =>
    useQuery({
      queryKey: permissionKeys.list(params),
      queryFn: () => httpClient.list<PermissionRecord>(API_ENDPOINTS.rbac.permissions, { params }),
      enabled: options?.enabled,
    }),
}
