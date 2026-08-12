import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/utils/cn'

/** Widths track the content, not the viewport, so dialogs stay readable. */
const SIZE_CLASSES = {
  sm: 'sm:max-w-sm',
  default: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
} as const

export type ModalSize = keyof typeof SIZE_CLASSES

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
  /** Action row. Buttons are laid out end-aligned on `sm` and up. */
  footer?: React.ReactNode
  size?: ModalSize
  /**
   * Set false to ignore Escape and overlay clicks — for work in flight that
   * would be lost, never merely to insist the user reads something.
   */
  dismissible?: boolean
  showCloseButton?: boolean
  className?: string
  /** Applied to the scrolling body wrapper. */
  bodyClassName?: string
}

/**
 * The standard dialog: header, scrolling body, action row.
 *
 * Wraps the `Dialog` primitive so screens do not re-assemble the same six parts
 * (and re-decide the same max-width) every time. Reach for `Dialog` directly only
 * when a layout genuinely differs from this shape.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'default',
  dismissible = true,
  showCloseButton = true,
  className,
  bodyClassName,
}: ModalProps) {
  const block = (event: Event): void => {
    if (!dismissible) event.preventDefault()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton && dismissible}
        onEscapeKeyDown={block}
        onPointerDownOutside={block}
        onInteractOutside={block}
        className={cn(SIZE_CLASSES[size], className)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {/* Radix wires aria-describedby only when a description exists. */}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children && (
          // Cap the body rather than the dialog so the header and actions stay
          // put while long content scrolls between them.
          <div className={cn('max-h-[60vh] overflow-y-auto', bodyClassName)}>{children}</div>
        )}

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
