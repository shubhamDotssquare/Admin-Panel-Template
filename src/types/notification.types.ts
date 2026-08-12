import type { IconComponent } from './common.types'

/** Visual intent of a notification row. */
export type NotificationTone = 'default' | 'info' | 'success' | 'warning' | 'destructive'

/**
 * One entry in the header notification panel.
 *
 * The shell only renders these — fetching, marking as read and real-time
 * updates belong to whichever module owns notifications.
 */
export interface NotificationItem {
  id: string
  title: string
  /** Supporting line, clamped to two lines in the panel. */
  description?: string
  /** Anything `Date` accepts; rendered as relative time ("3 hours ago"). */
  timestamp?: string | number | Date
  /** Unread rows carry a dot and a heavier title. */
  read?: boolean
  /** Route — or URL when `external` — opened when the row is activated. */
  path?: string
  external?: boolean
  icon?: IconComponent
  tone?: NotificationTone
}
