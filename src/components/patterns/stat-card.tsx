import { TrendingDown, TrendingUp } from 'lucide-react'
import { Link } from 'react-router'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { IconComponent } from '@/types/common.types'
import { cn } from '@/utils/cn'

export interface StatCardProps {
  label: string
  /** Pre-formatted — the card does not guess at locale or currency. */
  value: React.ReactNode
  icon?: IconComponent
  /** Supporting line, e.g. "vs. last month". */
  hint?: string
  /**
   * Signed change. Direction is taken from the sign, but `goodWhenDown` flips
   * the colouring for metrics where falling is the win — churn, error rate.
   */
  trend?: { value: string; direction: 'up' | 'down'; goodWhenDown?: boolean }
  isLoading?: boolean
  className?: string
  /** Route to navigate to when the card is clicked. Omit for a static card. */
  to?: string
}

/** One number on a list screen's summary row. */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  isLoading = false,
  className,
  to,
}: StatCardProps) {
  const isGood = trend ? (trend.direction === 'up') !== Boolean(trend.goodWhenDown) : false
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : TrendingDown
  const isLinked = Boolean(to) && !isLoading

  const card = (
    <Card
      className={cn(
        isLinked && 'transition-colors hover:border-muted-foreground/30 hover:bg-muted/50',
        className,
      )}
    >
      <CardContent className="flex items-start justify-between gap-3 py-1">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-caption text-muted-foreground">{label}</span>

          {isLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <span className="truncate text-heading-2">{value}</span>
          )}

          {(trend ?? hint) && !isLoading && (
            <span className="flex items-center gap-1.5 text-caption">
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-medium',
                    isGood ? 'text-success' : 'text-destructive',
                  )}
                >
                  <TrendIcon className="size-3.5" aria-hidden="true" />
                  {trend.value}
                </span>
              )}
              {hint && <span className="text-muted-foreground">{hint}</span>}
            </span>
          )}
        </div>

        {Icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
        )}
      </CardContent>
    </Card>
  )

  if (!isLinked) return card

  return (
    <Link
      to={to as string}
      aria-label={label}
      className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {card}
    </Link>
  )
}
