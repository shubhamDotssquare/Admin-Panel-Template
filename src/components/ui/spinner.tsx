import { Loader2 } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      xs: 'size-3',
      sm: 'size-4',
      default: 'size-5',
      lg: 'size-8',
    },
  },
  defaultVariants: { size: 'default' },
})

/**
 * The one spinner in the system — inline in buttons, centred in panels, or
 * wrapped by `LoadingScreen` for a whole route.
 *
 * Sizes line up with the `Button` scale so a spinner swapped into a button never
 * changes its height.
 */
function Spinner({
  className,
  size,
  label = 'Loading…',
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof spinnerVariants> & { label?: string }) {
  return (
    <span
      data-slot="spinner"
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <Loader2 className={cn(spinnerVariants({ size }))} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export { Spinner, spinnerVariants }
