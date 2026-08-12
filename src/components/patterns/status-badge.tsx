import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'

export type StatusTone = 'neutral' | 'success' | 'warning' | 'destructive' | 'info'

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'border-border bg-muted text-muted-foreground',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-info/30 bg-info/10 text-info',
}

/** How one status value should read and look. */
export interface StatusMeta {
  label: string
  tone: StatusTone
  /** Longer copy for a detail screen. */
  description?: string
}

export type StatusMap<TStatus extends string> = Record<TStatus, StatusMeta>

interface StatusBadgeProps<TStatus extends string> {
  status: TStatus | undefined
  map: StatusMap<TStatus>
  className?: string
}

/**
 * Renders a record's lifecycle state from a status map.
 *
 * The map lives with the module that owns the vocabulary — a user's `SUSPENDED`
 * and an article's `ARCHIVED` mean different things — while the colours stay
 * shared, so "bad" looks the same everywhere in the panel.
 */
export function StatusBadge<TStatus extends string>({
  status,
  map,
  className,
}: StatusBadgeProps<TStatus>) {
  const meta = status ? map[status] : undefined

  // An unmapped value is shown rather than hidden: silently dropping a status
  // the API started returning would hide a real problem.
  if (!meta) {
    return (
      <Badge variant="outline" className={className}>
        {status ?? 'Unknown'}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={cn(TONE_CLASSES[meta.tone], className)}>
      {meta.label}
    </Badge>
  )
}
