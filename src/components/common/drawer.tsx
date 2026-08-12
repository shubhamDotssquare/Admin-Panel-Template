import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/utils/cn'

export type DrawerSide = 'left' | 'right' | 'top' | 'bottom'
export type DrawerSize = 'sm' | 'default' | 'lg' | 'xl'

/** Side panels are sized by width, top and bottom sheets by height. */
const WIDTH_CLASSES: Record<DrawerSize, string> = {
  sm: 'sm:max-w-sm',
  default: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
}

const HEIGHT_CLASSES: Record<DrawerSize, string> = {
  sm: 'h-1/4',
  default: 'h-1/3',
  lg: 'h-1/2',
  xl: 'h-3/4',
}

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  side?: DrawerSide
  size?: DrawerSize
  /** Set false to ignore Escape and overlay clicks — for work in flight. */
  dismissible?: boolean
  className?: string
  bodyClassName?: string
}

/**
 * Off-canvas panel: header, scrolling body, pinned action row.
 *
 * The counterpart to `Modal` for work that benefits from staying beside the page
 * rather than covering it — filters, detail peeks, long create forms.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'default',
  dismissible = true,
  className,
  bodyClassName,
}: DrawerProps) {
  const isHorizontal = side === 'left' || side === 'right'

  const block = (event: Event): void => {
    if (!dismissible) event.preventDefault()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        showCloseButton={dismissible}
        onEscapeKeyDown={block}
        onPointerDownOutside={block}
        onInteractOutside={block}
        className={cn(
          'gap-0 p-0',
          isHorizontal ? WIDTH_CLASSES[size] : HEIGHT_CLASSES[size],
          className,
        )}
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-heading-4">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        {/* `min-h-0` lets this shrink inside the flex column so it, and not the
            panel, is what scrolls. */}
        <div className={cn('min-h-0 flex-1 overflow-y-auto p-4', bodyClassName)}>
          {children}
        </div>

        {footer && (
          <SheetFooter className="flex-row justify-end border-t border-border">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
