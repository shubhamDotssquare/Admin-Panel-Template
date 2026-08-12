import type { FieldValues } from 'react-hook-form'

import { PasswordInput } from '@/components/common/password-input'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, type FieldProps } from '../field'

type BaseProps<TValues extends FieldValues> = Omit<FieldProps<TValues>, 'children'>

export interface TextFieldProps<TValues extends FieldValues> extends BaseProps<TValues> {
  /**
   * `password` swaps in the reveal toggle, `phone` and `email` set the right
   * mobile keyboard and autofill hints — the differences are small but they are
   * exactly the ones nobody remembers to add by hand.
   */
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'search'
  placeholder?: string
  autoComplete?: string
  autoFocus?: boolean
  disabled?: boolean
  readOnly?: boolean
  maxLength?: number
}

/** Single-line input, including email, phone, URL, number and password. */
export function TextField<TValues extends FieldValues>({
  type = 'text',
  placeholder,
  autoComplete,
  autoFocus,
  disabled,
  readOnly,
  maxLength,
  ...fieldProps
}: TextFieldProps<TValues>) {
  return (
    <Field {...fieldProps}>
      {(field, ids) => {
        const shared = {
          ...field,
          ...ids,
          // A controlled input must never see `undefined`.
          value: (field.value as string | undefined) ?? '',
          placeholder,
          autoComplete,
          autoFocus,
          disabled: disabled ?? field.disabled,
          readOnly,
          maxLength,
        }

        if (type === 'password')
          return <PasswordInput {...shared} autoComplete={autoComplete} />

        return (
          <Input
            {...shared}
            type={type}
            // Numbers stay strings in form state; Zod coerces on submit. Mixing
            // types mid-edit is what produces the classic "0" that cannot be
            // deleted.
            inputMode={type === 'number' ? 'decimal' : type === 'tel' ? 'tel' : undefined}
          />
        )
      }}
    </Field>
  )
}

export interface TextareaFieldProps<TValues extends FieldValues> extends BaseProps<TValues> {
  placeholder?: string
  rows?: number
  disabled?: boolean
  maxLength?: number
}

/** Multi-line free text. */
export function TextareaField<TValues extends FieldValues>({
  placeholder,
  rows = 4,
  disabled,
  maxLength,
  ...fieldProps
}: TextareaFieldProps<TValues>) {
  return (
    <Field {...fieldProps}>
      {(field, ids) => (
        <Textarea
          {...field}
          {...ids}
          value={(field.value as string | undefined) ?? ''}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled ?? field.disabled}
          maxLength={maxLength}
        />
      )}
    </Field>
  )
}
