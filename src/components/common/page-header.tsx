import { useDocumentTitle } from '@/hooks/use-document-title'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  title: string
  description?: string
  /** Buttons or filters aligned to the right of the title. */
  actions?: React.ReactNode
  /** Also set `document.title` from `title`. Defaults to true. */
  setDocumentTitle?: boolean
  className?: string
}

/** Standard page heading — every module screen should open with one. */
export function PageHeader({
  title,
  description,
  actions,
  setDocumentTitle = true,
  className,
}: PageHeaderProps) {
  useDocumentTitle(setDocumentTitle ? title : undefined)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="truncate">{title}</h1>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
