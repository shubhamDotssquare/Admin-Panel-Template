import { useMutation, useQueryClient } from '@tanstack/react-query'

import { API_ENDPOINTS } from '@/constants/api-endpoints'
import { createResourceQueries } from '@/lib/create-resource-queries'
import { httpClient } from '@/services/http-client'
import type { CreateUserDto, UpdateUserDto, User } from '../types'

export const users = createResourceQueries<User, CreateUserDto, UpdateUserDto>(
  'users',
  API_ENDPOINTS.users.root,
)

export type UserLifecycleAction = 'activate' | 'deactivate' | 'suspend'

const LIFECYCLE_PATH: Record<UserLifecycleAction, (id: string) => string> = {
  activate: API_ENDPOINTS.users.activate,
  deactivate: API_ENDPOINTS.users.deactivate,
  suspend: API_ENDPOINTS.users.suspend,
}

/** Activate, deactivate or suspend — each its own endpoint, not a status PATCH. */
export function useUserLifecycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: UserLifecycleAction }) =>
      httpClient.post<User>(LIFECYCLE_PATH[action](id)),
    meta: { invalidates: [users.keys.all()] },
    onSuccess: (updated) => {
      if (updated?.id) queryClient.setQueryData(users.keys.detail(updated.id), updated)
    },
  })
}
