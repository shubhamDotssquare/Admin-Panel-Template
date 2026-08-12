import { Bell, CheckCheck } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { NotificationItem, NotificationTone } from '@/types/notification.types'
import { formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'

export interface NotificationMenuProps {
  /** Rows to render. An empty list shows the empty state, not a hidden panel. */
  notifications?: NotificationItem[]
  /** Omit to hide the "Mark all read" action. */
  onMarkAllRead?: () => void
  /** Fired on activation, before any navigation — use it to mark as read. */
  onSelect?: (item: NotificationItem) => void
  /** Footer link target. Omit to hide the footer. */
  viewAllPath?: string
  /** Rows rendered inside the panel; the rest stay behind "View all". */
  maxVisible?: number
}

const TONE_DOT: Record<NotificationTone, string> = {
  default: 'bg-muted-foreground',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

/** Counts above this render as "99+" so the trigger keeps its size. */
const MAX_COUNT = 99

function UnreadCount({ count }: { count: number }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center',
        'rounded-full bg-destructive px-1 text-[0.625rem] font-semibold text-white',
        'ring-2 ring-background',
      )}
    >
      {count > MAX_COUNT ? `${MAX_COUNT}+` : count}
    </span>
  )
}

/** A single row: link when it carries a path, plain button otherwise. */
function NotificationRow({
  item,
  onSelect,
}: {
  item: NotificationItem
  onSelect?: (item: NotificationItem) => void
}) {
  const Icon = item.icon

  const body = (
    <>
      {Icon ? (
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'mt-1.5 size-2 shrink-0 rounded-full',
            TONE_DOT[item.tone ?? 'default'],
            item.read && 'opacity-40',
          )}
        />
      )}

      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={cn('truncate text-sm', item.read ? 'font-normal' : 'font-semibold')}>
          {item.title}
        </span>

        {item.description && (
          <span className="line-clamp-2 text-caption text-muted-foreground">
            {item.description}
          </span>
        )}

        {item.timestamp && (
          <span className="text-caption text-muted-foreground/80">
            {formatRelativeTime(item.timestamp)}
          </span>
        )}
      </span>

      {!item.read && (
        <span
          aria-label="Unread"
          className="mt-1.5 ml-auto size-1.5 shrink-0 rounded-full bg-primary"
        />
      )}
    </>
  )

  const rowClasses = 'flex w-full items-start gap-2.5 px-2 py-2 text-left whitespace-normal'

  if (item.path && !item.external) {
    return (
      <DropdownMenuItem asChild onSelect={() => onSelect?.(item)}>
        <Link to={item.path} className={rowClasses}>
          {body}
        </Link>
      </DropdownMenuItem>
    )
  }

  if (item.path) {
    return (
      <DropdownMenuItem asChild onSelect={() => onSelect?.(item)}>
        <a href={item.path} target="_blank" rel="noreferrer noopener" className={rowClasses}>
          {body}
        </a>
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuItem className={rowClasses} onSelect={() => onSelect?.(item)}>
      {body}
    </DropdownMenuItem>
  )
}

/**
 * Header notification panel.
 *
 * Presentational by design: the shell holds no notification state, so any
 * backend — polling, websocket, or a stubbed list — can drive it.
 */
export function NotificationMenu({
  notifications = [],
  onMarkAllRead,
  onSelect,
  viewAllPath,
  maxVisible = 6,
}: NotificationMenuProps) {
  const unreadCount = notifications.filter((item) => !item.read).length
  const visible = notifications.slice(0, maxVisible)
  const hiddenCount = notifications.length - visible.length

  const label = unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={label}>
              <Bell className="size-4" />
              {unreadCount > 0 && <UnreadCount count={unreadCount} />}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <p className="text-heading-4">Notifications</p>

          {onMarkAllRead && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1.5 px-1.5 py-1 text-caption"
              onClick={onMarkAllRead}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator className="my-0" />

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
            <Bell className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">You are all caught up</p>
            <p className="text-caption text-muted-foreground">
              New notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto p-1">
            {visible.map((item) => (
              <NotificationRow key={item.id} item={item} onSelect={onSelect} />
            ))}
          </div>
        )}

        {viewAllPath && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <DropdownMenuItem asChild>
              <Link
                to={viewAllPath}
                className="justify-center py-2 text-sm font-medium text-primary"
              >
                {hiddenCount > 0 ? `View all (${hiddenCount} more)` : 'View all'}
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
