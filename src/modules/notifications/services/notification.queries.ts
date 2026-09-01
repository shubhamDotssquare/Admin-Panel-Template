import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createResourceQueries } from '@/lib/create-resource-queries'
import { httpClient } from '@/services/http-client'
import type { CreateNotificationDto, Notification, UpdateNotificationDto } from '../types'

export const notifications = createResourceQueries<
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto
>('notifications', '/notifications')

/** Marks one notification read — its own endpoint, not a status PATCH. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => httpClient.patch<Notification>(`/notifications/${id}/read`),
    meta: { invalidates: [notifications.keys.all()] },
    onSuccess: (updated) => {
      if (updated?.id) queryClient.setQueryData(notifications.keys.detail(updated.id), updated)
    },
  })
}
