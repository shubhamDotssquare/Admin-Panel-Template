import { useState } from 'react'
import { Braces, Wand2 } from 'lucide-react'
import type { FieldValues } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils/cn'
import { Field, type FieldProps } from '../field'

type BaseProps<TValues extends FieldValues> = Omit<FieldProps<TValues>, 'children'>

export interface JsonFieldProps<TValues extends FieldValues> extends BaseProps<TValues> {
  rows?: number
  disabled?: boolean
  placeholder?: string
}

/**
 * Raw JSON, edited as text.
 *
 * The value stays a **string** while editing rather than a parsed object: any
 * half-typed state is invalid JSON, and re-serialising on every keystroke fights
 * the user's cursor and formatting. Parse in the Zod schema, which is where the
 * shape is described anyway:
 *
 * ```ts
 * metadata: z.string().refine((text) => {
 *   try { JSON.parse(text); return true } catch { return false }
 * }, 'Enter valid JSON')
 * ```
 */
export function JsonField<TValues extends FieldValues>({
  rows = 8,
  disabled,
  placeholder = '{\n  "key": "value"\n}',
  ...fieldProps
}: JsonFieldProps<TValues>) {
  const [parseError, setParseError] = useState<string | null>(null)

  return (
    <Field {...fieldProps}>
      {(field, ids) => {
        const text = (field.value as string | undefined) ?? ''

        const check = (value: string): void => {
          if (value.trim() === '') return setParseError(null)
          try {
            JSON.parse(value)
            setParseError(null)
          } catch (error) {
            setParseError(error instanceof Error ? error.message : 'Invalid JSON')
          }
        }

        const format = (): void => {
          try {
            field.onChange(JSON.stringify(JSON.parse(text), null, 2))
            setParseError(null)
          } catch {
            // Nothing to format; the message below already says why.
          }
        }

        return (
          <div className="flex flex-col gap-1.5">
            <Textarea
              {...ids}
              name={field.name}
              ref={field.ref}
              value={text}
              rows={rows}
              placeholder={placeholder}
              disabled={disabled ?? field.disabled}
              spellCheck={false}
              onChange={(event) => {
                field.onChange(event.target.value)
                check(event.target.value)
              }}
              onBlur={() => {
                check(text)
                field.onBlur()
              }}
              className={cn('font-mono text-sm', parseError && 'border-destructive')}
            />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={format}
                disabled={disabled ?? !text.trim()}
              >
                <Wand2 className="size-3" />
                Format
              </Button>

              <span
                className={cn(
                  'flex items-center gap-1 text-caption',
                  parseError ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                <Braces className="size-3" aria-hidden="true" />
                {parseError ?? (text.trim() ? 'Valid JSON' : 'Empty')}
              </span>
            </div>
          </div>
        )
      }}
    </Field>
  )
}
