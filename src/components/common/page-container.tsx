import { appConfig } from '@/config/app.config'
import { cn } from '@/utils/cn'

interface PageContainerProps {
  children: React.ReactNode
  /** Let content span the full viewport width, ignoring the max-width token. */
  fullWidth?: boolean
  className?: string
}

/** Applies the standard content padding and max-width from the layout tokens. */
export function PageContainer({ children, fullWidth, className }: PageContainerProps) {
  const constrain = appConfig.layout.constrainContentWidth && !fullWidth

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col gap-section p-gutter',
        constrain && 'mx-auto max-w-content',
        className,
      )}
    >
      {children}
    </div>
  )
}
