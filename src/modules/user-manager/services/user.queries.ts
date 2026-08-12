import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createResourceQueries } from '@/lib/create-resource-queries'
import { httpClient } from '@/services/http-client'
import type { CreateUserDto, UpdateUserDto, User, UserStatus } from '../types'

const RESOURCE = '/users'

/**
 * The module's data layer.
 *
 * CRUD, caching, invalidation and pagination all come from the framework
 * factory; only what is genuinely specific to users is written here.
 */
export const users = createResourceQueries<User, CreateUserDto, UpdateUserDto>(
  'users',
  RESOURCE,
)

/**
 * Status changes are their own endpoint rather than a `PATCH` of the record:
 * suspending an account is an action with side effects server-side (sessions
 * revoked, notifications sent), not a field edit.
 */
export function useSetUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      httpClient.patch<User>(`${RESOURCE}/${id}/status`, { status }),
    // Both the row in every list and the record itself are now stale.
    meta: { invalidates: [users.keys.all()] },
    onSuccess: (updated) => {
      // Seed the detail cache so navigating straight to the record shows the
      // new status without a flash of the old one.
      queryClient.setQueryData(users.keys.detail(updated.id), updated)
    },
  })
}
