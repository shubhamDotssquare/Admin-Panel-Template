import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/utils/cn'

/** Spinner shown while a lazy route chunk resolves. */
export function LoadingScreen({
  label = 'Loading…',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn('flex min-h-64 w-full flex-1 items-center justify-center gap-2', className)}
    >
      {/* `Spinner` carries the live region; the visible label is its text twin. */}
      <Spinner className="text-muted-foreground" label={label} />
      <span className="text-body text-muted-foreground">{label}</span>
    </div>
  )
}

/** Coarse page skeleton — closer to the real layout than a bare spinner. */
export function PageSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-72 rounded-lg" />
    </div>
  )
}
