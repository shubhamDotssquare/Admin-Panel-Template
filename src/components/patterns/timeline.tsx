import { Circle } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import type { IconComponent } from '@/types/common.types'
import { formatDateTime, formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'

export type TimelineTone = 'default' | 'success' | 'warning' | 'destructive' | 'info'

const TONE_CLASSES: Record<TimelineTone, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
}

export interface TimelineEvent {
  id: string
  title: React.ReactNode
  description?: React.ReactNode
  /** Anything `Date` accepts. Shown as relative time, exact on hover. */
  timestamp?: string | number | Date
  /** Who did it. */
  actor?: string
  icon?: IconComponent
  tone?: TimelineTone
  /** Before/after pairs — what makes an audit history useful. */
  changes?: { field: string; from?: React.ReactNode; to?: React.ReactNode }[]
}

export interface TimelineProps {
  events: TimelineEvent[]
  isLoading?: boolean
  skeletonCount?: number
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

/**
 * Chronological event list — serves both the "Activity" and "History" tabs.
 *
 * They are the same shape: something happened, someone did it, at a time.
 * History entries add `changes`, which is why that field exists rather than a
 * second near-identical component.
 */
export function Timeline({
  events,
  isLoading = false,
  skeletonCount = 4,
  emptyTitle = 'Nothing recorded yet',
  emptyDescription = 'Activity will appear here as it happens.',
  className,
}: TimelineProps) {
  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-6', className)} aria-hidden="true">
        {Array.from({ length: skeletonCount }, (_, index) => (
          <div key={index} className="flex gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} className="border-none" />
    )
  }

  return (
    <ol className={cn('flex flex-col', className)}>
      {events.map((event, index) => {
        const Icon = event.icon ?? Circle
        const isLast = index === events.length - 1

        return (
          <li key={event.id} className="flex gap-3">
            {/* Marker column: dot plus the connecting rail. */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full',
                  TONE_CLASSES[event.tone ?? 'default'],
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              {/* The last item has nothing below it to connect to. */}
              {!isLast && <span className="w-px flex-1 bg-border" aria-hidden="true" />}
            </div>

            <div className={cn('flex min-w-0 flex-1 flex-col gap-1', !isLast && 'pb-6')}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-body font-medium">{event.title}</span>
                {event.timestamp && (
                  <time
                    className="text-caption text-muted-foreground"
                    dateTime={new Date(event.timestamp).toISOString()}
                    // Relative time reads better; the exact stamp is a hover away.
                    title={formatDateTime(event.timestamp)}
                  >
                    {formatRelativeTime(event.timestamp)}
                  </time>
                )}
              </div>

              {event.actor && (
                <span className="text-caption text-muted-foreground">by {event.actor}</span>
              )}

              {event.description && (
                <div className="text-body text-muted-foreground">{event.description}</div>
              )}

              {event.changes && event.changes.length > 0 && (
                <ul className="mt-1 flex flex-col gap-1">
                  {event.changes.map((change) => (
                    <li key={change.field} className="text-caption">
                      <span className="font-medium">{change.field}</span>{' '}
                      <span className="text-muted-foreground line-through">
                        {change.from ?? '—'}
                      </span>{' '}
                      <span aria-hidden="true">→</span> <span>{change.to ?? '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
