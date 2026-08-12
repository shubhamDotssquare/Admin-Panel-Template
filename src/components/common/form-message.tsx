import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

import type { IconComponent } from '@/types/common.types'
import { cn } from '@/utils/cn'

type MessageTone = 'error' | 'success' | 'info'

const TONE: Record<MessageTone, { icon: IconComponent; classes: string; role: string }> = {
  error: {
    icon: AlertTriangle,
    classes: 'border-destructive/30 bg-destructive/10 text-destructive',
    // Assertive: a failed submit should interrupt, not wait for a pause.
    role: 'alert',
  },
  success: {
    icon: CheckCircle2,
    classes: 'border-success/30 bg-success/10 text-success',
    role: 'status',
  },
  info: {
    icon: Info,
    classes: 'border-info/30 bg-info/10 text-info',
    role: 'status',
  },
}

/**
 * Whole-form banner for submit failures and confirmations.
 *
 * Renders nothing without children, so it can sit unconditionally in a form and
 * simply appear when a message arrives.
 */
export function FormMessage({
  tone = 'error',
  children,
  className,
}: {
  tone?: MessageTone
  children?: React.ReactNode
  className?: string
}) {
  if (!children) return null

  const { icon: Icon, classes, role } = TONE[tone]

  return (
    <div
      role={role}
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2.5 text-caption',
        classes,
        className,
      )}
    >
      <Icon className="mt-px size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </div>
  )
}
