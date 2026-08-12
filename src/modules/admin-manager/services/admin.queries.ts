import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createResourceQueries } from '@/lib/create-resource-queries'
import { httpClient } from '@/services/http-client'
import type { Admin, AdminStatus, CreateAdminDto, Role, UpdateAdminDto } from '../types'

const ADMINS = '/admins'
const ROLES = '/roles'

export const admins = createResourceQueries<Admin, CreateAdminDto, UpdateAdminDto>(
  'admins',
  ADMINS,
)

export const roles = createResourceQueries<Role, Partial<Role>>('roles', ROLES)

/** Status changes are an action, not a field edit — see the user module. */
export function useSetAdminStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminStatus }) =>
      httpClient.patch<Admin>(`${ADMINS}/${id}/status`, { status }),
    meta: { invalidates: [admins.keys.all()] },
    onSuccess: (updated) => {
      queryClient.setQueryData(admins.keys.detail(updated.id), updated)
    },
  })
}

/**
 * Replace an administrator's roles.
 *
 * Separate from the record update so role changes can be audited and authorised
 * on their own — granting access is the one edit that most warrants it.
 */
export function useAssignRoles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, roles: next }: { id: string; roles: string[] }) =>
      httpClient.put<Admin>(`${ADMINS}/${id}/roles`, { roles: next }),
    meta: { invalidates: [admins.keys.all()] },
    onSuccess: (updated) => {
      queryClient.setQueryData(admins.keys.detail(updated.id), updated)
    },
  })
}

/** Every role, for the pickers. Roles are few and change rarely. */
export function useRoleOptions() {
  const query = roles.useList({ perPage: 100 })

  return {
    ...query,
    options: (query.data?.items ?? []).map((role) => ({
      label: role.name,
      value: role.id,
      description: role.description,
    })),
  }
}
