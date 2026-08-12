import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

export interface DescriptionItem {
  label: string
  /** Pre-formatted. Falsy values render as a muted dash. */
  value: React.ReactNode
  /** Let a long value span the full width instead of one column. */
  full?: boolean
}

export interface DescriptionListProps {
  items: DescriptionItem[]
  /** Columns at `sm` and above. Single column on mobile regardless. */
  columns?: 1 | 2 | 3
  isLoading?: boolean
  className?: string
}

/**
 * Label/value pairs — the backbone of a record's overview tab.
 *
 * A `<dl>` rather than a table: this is one record's attributes, not rows of
 * comparable data, and screen readers announce the pairing.
 */
export function DescriptionList({
  items,
  columns = 2,
  isLoading = false,
  className,
}: DescriptionListProps) {
  return (
    <dl
      className={cn(
        'grid gap-x-6 gap-y-4',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn('flex min-w-0 flex-col gap-1', item.full && 'sm:col-span-full')}
        >
          <dt className="text-caption text-muted-foreground">{item.label}</dt>
          <dd className="text-body break-words">
            {isLoading ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              (item.value ?? <span className="text-muted-foreground">—</span>)
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
