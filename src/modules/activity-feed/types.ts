/**
 * `ActivityFeedItem` from the API — a stream of human-readable events shown
 * to end users, e.g. "user_registered". Unlike audit logs, these are
 * ordinary CRUD records: an admin can create, edit and delete them.
 */
export interface ActivityFeedItem {
  id: string
  /** e.g. `"user_registered"`. */
  type: string
  message: string
  createdAt: string
  updatedAt: string
}

export interface CreateActivityFeedItemDto {
  type: string
  message: string
}

export type UpdateActivityFeedItemDto = Partial<CreateActivityFeedItemDto>
