import { Inbox } from 'lucide-react'

import type { IconComponent } from '@/types/common.types'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: IconComponent
  /** Primary call to action, e.g. a "Create" button. */
  action?: React.ReactNode
  className?: string
}

/** Placeholder for empty lists, cleared filters and unbuilt screens. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border-border',
        'border border-dashed px-6 py-14 text-center',
        className,
      )}
    >
      <div className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>

      <div className="space-y-1">
        <h3 className="text-heading-4">{title}</h3>
        {description && (
          <p className="mx-auto max-w-md text-body text-muted-foreground">{description}</p>
        )}
      </div>

      {action}
    </div>
  )
}
