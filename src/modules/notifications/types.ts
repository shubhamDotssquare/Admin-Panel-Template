/**
 * `Notification` from the API.
 *
 * A `recipientAdminId` of `null` means the notification was broadcast to every
 * admin rather than addressed to one.
 */
export interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  /** Set by the server when the "mark as read" action runs. Read-only. */
  readAt?: string | null
  /** `null` = broadcast to all admins. */
  recipientAdminId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateNotificationDto {
  title: string
  message: string
  type: string
  recipientAdminId?: string
}

export type UpdateNotificationDto = Partial<CreateNotificationDto>
