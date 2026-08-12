import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * `size` shadows the native numeric input attribute — which this project never
 * uses — in exchange for control heights that match `Button` and
 * `SelectTrigger`, so a field and the button beside it always line up.
 */
type InputProps = Omit<React.ComponentProps<'input'>, 'size'> & {
  size?: 'sm' | 'default' | 'lg'
}

function Input({ className, type, size = 'default', ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(
        'w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
        'data-[size=default]:h-9 data-[size=lg]:h-10 data-[size=sm]:h-8',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  )
}

export { Input, type InputProps }
