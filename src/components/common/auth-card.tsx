import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { IconComponent } from '@/types/common.types'
import { cn } from '@/utils/cn'

interface AuthCardProps {
  title: string
  description?: React.ReactNode
  icon?: IconComponent
  children: React.ReactNode
  /** Secondary links below the card — "Back to sign in", "Create account", … */
  footer?: React.ReactNode
  className?: string
}

/**
 * Shared frame for every authentication screen.
 *
 * Keeps the four screens visually identical so rebranding is one file, and so a
 * project adding a fifth (SSO, accept-invite) inherits the same shape for free.
 */
export function AuthCard({
  title,
  description,
  icon: Icon,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      <Card>
        <CardHeader className="text-center">
          {Icon && (
            <div className="mx-auto grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
              <Icon className="size-5" />
            </div>
          )}
          <CardTitle className="text-heading-3">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>

        <CardContent>{children}</CardContent>
      </Card>

      {footer && <div className="text-center text-caption">{footer}</div>}
    </div>
  )
}
