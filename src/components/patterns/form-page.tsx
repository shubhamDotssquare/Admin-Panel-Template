import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

import { LoadingScreen } from '@/components/common/loading-screen'
import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { cn } from '@/utils/cn'

export interface FormPageProps {
  title: string
  description?: string
  /** Where "back" goes — usually the module's list screen. */
  backTo?: string
  backLabel?: string
  /** Blocks the form until the record being edited has loaded. */
  isLoading?: boolean
  /** Shown instead of the form when the record could not be loaded. */
  error?: React.ReactNode
  children: React.ReactNode
  /** Constrain the form's width. Long forms read badly at full width. */
  width?: 'narrow' | 'wide' | 'full'
  setDocumentTitle?: boolean
  className?: string
}

const WIDTHS = {
  narrow: 'max-w-xl',
  wide: 'max-w-3xl',
  full: undefined,
} as const

/**
 * The standard shape of a create or edit screen.
 *
 * Create and edit are the same layout with different copy and defaults, so both
 * routes render this and differ only in what they hand the form — which is what
 * keeps a module from growing two nearly-identical screens that drift apart.
 */
export function FormPage({
  title,
  description,
  backTo,
  backLabel = 'Back',
  isLoading = false,
  error,
  children,
  width = 'wide',
  setDocumentTitle = true,
  className,
}: FormPageProps) {
  useDocumentTitle(setDocumentTitle ? title : undefined)

  // Truthiness rather than `??`: callers naturally write
  // `error={isError && <…/>}`, which yields `false` for the happy path — and
  // `false ?? children` is `false`, which would silently render no form at all.
  let body: React.ReactNode = children
  if (isLoading) body = <LoadingScreen label="Loading…" />
  else if (error) body = error

  return (
    <PageContainer className={className}>
      {backTo && (
        <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
          <Link to={backTo}>
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        </Button>
      )}

      <PageHeader title={title} description={description} setDocumentTitle={false} />

      <div className={cn('w-full', WIDTHS[width])}>{body}</div>
    </PageContainer>
  )
}
