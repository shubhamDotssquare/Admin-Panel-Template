import type { FieldValues } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Field, type FieldProps } from '../field'

type BaseProps<TValues extends FieldValues> = Omit<FieldProps<TValues>, 'children'>

export interface DateFieldProps<TValues extends FieldValues> extends BaseProps<TValues> {
  /** `datetime` maps to `datetime-local`. */
  mode?: 'date' | 'time' | 'datetime'
  /** Bounds, in the same format the mode stores. */
  min?: string
  max?: string
  disabled?: boolean
}

/**
 * Date, time or date-and-time.
 *
 * Native inputs on purpose. A custom calendar means another dependency plus its
 * own keyboard, locale and screen-reader story, and the platform already ships
 * one that speaks the user's locale and works on touch. Swap a calendar in
 * behind this same field API if a project needs range selection or presets.
 *
 * The stored value is whatever the input produces — `YYYY-MM-DD`, `HH:mm`, or
 * `YYYY-MM-DDTHH:mm`. Converting to an ISO instant is the submit handler's job,
 * because only it knows the intended timezone.
 */
export function DateField<TValues extends FieldValues>({
  mode = 'date',
  min,
  max,
  disabled,
  ...fieldProps
}: DateFieldProps<TValues>) {
  const type = mode === 'datetime' ? 'datetime-local' : mode

  return (
    <Field {...fieldProps}>
      {(field, ids) => (
        <Input
          {...field}
          {...ids}
          type={type}
          value={(field.value as string | undefined) ?? ''}
          min={min}
          max={max}
          disabled={disabled ?? field.disabled}
          // Without this the control collapses to its text width in Safari.
          className="w-full"
        />
      )}
    </Field>
  )
}
