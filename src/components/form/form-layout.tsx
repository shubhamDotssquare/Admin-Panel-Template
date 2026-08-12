import { useFormContext } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { IconComponent } from '@/types/common.types'
import { cn } from '@/utils/cn'

export interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  /** Render without the surrounding card — for sections already inside one. */
  bare?: boolean
  /** Controls beside the heading. */
  actions?: React.ReactNode
  className?: string
}

/** A titled group of related fields. */
export function FormSection({
  title,
  description,
  children,
  bare = false,
  actions,
  className,
}: FormSectionProps) {
  const body = <div className={cn('flex flex-col gap-field', className)}>{children}</div>

  if (bare) {
    return (
      <section className="flex flex-col gap-3">
        {(title ?? description) && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              {title && <h3 className="text-heading-4">{title}</h3>}
              {description && (
                <p className="text-caption text-muted-foreground">{description}</p>
              )}
            </div>
            {actions}
          </div>
        )}
        {body}
      </section>
    )
  }

  return (
    <Card>
      {(title ?? description) && (
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              {title && <CardTitle className="text-heading-4">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {actions}
          </div>
        </CardHeader>
      )}
      <CardContent>{body}</CardContent>
    </Card>
  )
}

export interface FieldGroupProps {
  children: React.ReactNode
  /** Columns at `sm` and up. Always one column on mobile. */
  columns?: 1 | 2 | 3
  className?: string
}

/** Lays fields side by side — first/last name, city/postcode. */
export function FieldGroup({ children, columns = 2, className }: FieldGroupProps) {
  return (
    <div
      className={cn(
        'grid gap-field',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  )
}

export interface FormTab {
  id: string
  label: string
  icon?: IconComponent
  content: React.ReactNode
  /**
   * Field names owned by this tab. Supplying them lets the tab show an error
   * marker when a failed submit left problems on a tab that is not visible —
   * without it, the form looks like it silently refused to save.
   */
  fields?: string[]
}

export interface FormTabsProps {
  tabs: FormTab[]
  defaultTab?: string
  className?: string
}

/** Splits a long form into tabs, surfacing validation errors on hidden ones. */
export function FormTabs({ tabs, defaultTab, className }: FormTabsProps) {
  const { formState } = useFormContext()

  const hasError = (tab: FormTab): boolean =>
    Boolean(tab.fields?.some((name) => Boolean(formState.errors[name])))

  return (
    <Tabs defaultValue={defaultTab ?? tabs[0]?.id} className={cn('gap-section', className)}>
      <TabsList variant="line" className="overflow-x-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
            {tab.icon && <tab.icon className="size-4" aria-hidden="true" />}
            {tab.label}
            {hasError(tab) && (
              <span className="size-1.5 rounded-full bg-destructive" aria-label="has errors" />
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="flex flex-col gap-section">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export interface FormActionsProps {
  /** Defaults to "Save changes". */
  submitLabel?: string
  submittingLabel?: string
  onCancel?: () => void
  cancelLabel?: string
  /** Extra controls on the left, e.g. a destructive "Delete". */
  children?: React.ReactNode
  /** Disable submit until something has actually changed. */
  requireDirty?: boolean
  /** Stretch the submit button — the convention on narrow auth cards. */
  fullWidth?: boolean
  className?: string
}

/**
 * The submit row, wired to form state.
 *
 * Reads `isSubmitting` and `isDirty` from context rather than taking them as
 * props, so a screen cannot forget to disable the button and let a user
 * double-submit.
 */
export function FormActions({
  submitLabel = 'Save changes',
  submittingLabel = 'Saving…',
  onCancel,
  cancelLabel = 'Cancel',
  children,
  requireDirty = false,
  fullWidth = false,
  className,
}: FormActionsProps) {
  const { formState } = useFormContext()
  const { isSubmitting, isDirty } = formState

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', fullWidth && 'flex-col', className)}
    >
      {children}

      <div className={cn('flex items-center gap-2', fullWidth ? 'w-full' : 'ml-auto')}>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className={cn(fullWidth && 'flex-1')}
          >
            {cancelLabel}
          </Button>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || (requireDirty && !isDirty)}
          className={cn(fullWidth && 'flex-1')}
        >
          {isSubmitting && <Spinner size="sm" />}
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </div>
  )
}
