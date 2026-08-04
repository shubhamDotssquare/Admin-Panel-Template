import { Link } from 'react-router'

import { appConfig } from '@/config/app.config'
import { cn } from '@/utils/cn'

interface AppBrandProps {
  /** Hide the wordmark, keeping only the mark (collapsed sidebar). */
  compact?: boolean
  className?: string
}

/**
 * The product mark. Swap the square for a real logo here and it updates
 * everywhere the brand appears.
 */
export function AppBrand({ compact = false, className }: AppBrandProps) {
  return (
    <Link
      to={appConfig.homePath}
      className={cn(
        'flex items-center gap-2.5 rounded-md transition-opacity hover:opacity-80',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
      aria-label={appConfig.name}
    >
      <span
        className={cn(
          'grid size-8 shrink-0 bg-sidebar-primary text-sidebar-primary-foreground',
          'place-items-center rounded-md text-sm font-bold tracking-tight',
        )}
        aria-hidden="true"
      >
        {appConfig.shortName}
      </span>

      {!compact && (
        <span className="truncate text-heading-4 leading-none">{appConfig.name}</span>
      )}
    </Link>
  )
}
