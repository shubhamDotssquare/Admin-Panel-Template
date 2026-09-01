import { useMutation, useQueryClient } from '@tanstack/react-query'

import { API_ENDPOINTS } from '@/constants/api-endpoints'
import { createResourceQueries } from '@/lib/create-resource-queries'
import { createQueryKeys } from '@/lib/query-keys'
import { httpClient } from '@/services/http-client'
import { rbacService } from '@/services/rbac.service'
import { useQuery } from '@tanstack/react-query'
import type { Admin, CreateAdminDto, UpdateAdminDto } from '../types'

export const admins = createResourceQueries<Admin, CreateAdminDto, UpdateAdminDto>(
  'admins',
  API_ENDPOINTS.admins.root,
)

/** Cache namespace for an admin's RBAC role assignments. */
export const adminRoleKeys = createQueryKeys('admin-roles')

/** Which lifecycle transition to apply. Each is its own endpoint. */
export type AdminLifecycleAction = 'activate' | 'deactivate' | 'suspend'

const LIFECYCLE_PATH: Record<AdminLifecycleAction, (id: string) => string> = {
  activate: API_ENDPOINTS.admins.activate,
  deactivate: API_ENDPOINTS.admins.deactivate,
  suspend: API_ENDPOINTS.admins.suspend,
}

/**
 * Activate, deactivate or suspend an admin.
 *
 * Separate endpoints rather than a status `PATCH`, because deactivate and
 * suspend also end that admin's sessions server-side — they are actions, not
 * field edits.
 */
export function useAdminLifecycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: AdminLifecycleAction }) =>
      httpClient.post<Admin>(LIFECYCLE_PATH[action](id)),
    meta: { invalidates: [admins.keys.all()] },
    onSuccess: (updated) => {
      if (updated?.id) queryClient.setQueryData(admins.keys.detail(updated.id), updated)
    },
  })
}

/** The RBAC roles one admin holds, plus what they add up to. */
export function useAdminRoles(adminId: string | undefined) {
  return useQuery({
    queryKey: adminRoleKeys.detail(adminId ?? ''),
    queryFn: () => rbacService.adminRoles(adminId as string),
    enabled: Boolean(adminId),
  })
}

export function useAssignRole(adminId: string) {
  return useMutation({
    mutationFn: (roleId: string) => rbacService.assignRole(adminId, roleId),
    meta: { invalidates: [adminRoleKeys.all(), admins.keys.all()] },
  })
}

export function useRevokeRole(adminId: string) {
  return useMutation({
    mutationFn: (roleId: string) => rbacService.revokeRole(adminId, roleId),
    meta: { invalidates: [adminRoleKeys.all(), admins.keys.all()] },
  })
}
