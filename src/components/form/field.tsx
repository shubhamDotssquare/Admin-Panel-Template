import { useId } from 'react'
import {
  Controller,
  useFormContext,
  type ControllerRenderProps,
  type FieldValues,
  type Path,
} from 'react-hook-form'

import { Label } from '@/components/ui/label'
import { cn } from '@/utils/cn'

/** Props the wrapper generates for whatever control it wraps. */
export interface FieldControlProps {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': boolean
}

export interface FieldProps<TValues extends FieldValues> {
  name: Path<TValues>
  label?: string
  /** Helper text, shown while the field is valid. */
  hint?: string
  required?: boolean
  /** Rendered on the label row — a "Forgot password?" link, say. */
  action?: React.ReactNode
  /** The control. Spread both argument objects onto it. */
  children: (
    field: ControllerRenderProps<TValues, Path<TValues>>,
    ids: FieldControlProps,
  ) => React.ReactNode
  className?: string
  /** Lay the label beside the control — for switches and single checkboxes. */
  inline?: boolean
}

/**
 * Binds one control to the form and renders its label, message and ARIA wiring.
 *
 * The control is a render prop rather than a prop-union, so the same wrapper
 * serves inputs, selects, editors and anything a module invents later without
 * growing a discriminated type. Both objects are meant to be spread:
 *
 * ```tsx
 * <Field name="email" label="Email" required>
 *   {(field, ids) => <Input {...field} {...ids} type="email" />}
 * </Field>
 * ```
 */
export function Field<TValues extends FieldValues>({
  name,
  label,
  hint,
  required,
  action,
  children,
  className,
  inline = false,
}: FieldProps<TValues>) {
  const form = useFormContext<TValues>()
  const generatedId = useId()

  const id = `${generatedId}-${name}`
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => {
        const error = fieldState.error?.message

        // Point at whichever message is rendered; the error replaces the hint.
        let describedBy: string | undefined
        if (error) describedBy = errorId
        else if (hint) describedBy = hintId

        const ids: FieldControlProps = {
          id,
          'aria-describedby': describedBy,
          'aria-invalid': Boolean(error),
        }

        const labelNode = label ? (
          <Label htmlFor={id}>
            {label}
            {required && (
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </Label>
        ) : null

        if (inline) {
          return (
            <div className={cn('flex flex-col gap-field-inner', className)}>
              <div className="flex items-start gap-2.5">
                {children(field, ids)}
                <div className="flex min-w-0 flex-col gap-0.5">
                  {labelNode}
                  {hint && !error && (
                    <p id={hintId} className="text-caption text-muted-foreground">
                      {hint}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <p id={errorId} className="text-caption text-destructive">
                  {error}
                </p>
              )}
            </div>
          )
        }

        return (
          <div className={cn('flex min-w-0 flex-col gap-field-inner', className)}>
            {(labelNode ?? action) && (
              <div className="flex items-center justify-between gap-2">
                {labelNode}
                {action}
              </div>
            )}

            {children(field, ids)}

            {error ? (
              <p id={errorId} className="text-caption text-destructive">
                {error}
              </p>
            ) : (
              hint && (
                <p id={hintId} className="text-caption text-muted-foreground">
                  {hint}
                </p>
              )
            )}
          </div>
        )
      }}
    />
  )
}
