import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'

/** Password field with a reveal toggle. Accepts every native input prop. */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const [isVisible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={isVisible ? 'text' : 'password'}
        className={cn('pr-9', className)}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        // Toggling is a convenience, not a step in the form: keeping it out of
        // the tab order stops it landing between the field and the submit button.
        tabIndex={-1}
        onClick={() => setVisible((previous) => !previous)}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        className="absolute top-0.5 right-0.5 text-muted-foreground hover:bg-transparent"
      >
        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  )
}
