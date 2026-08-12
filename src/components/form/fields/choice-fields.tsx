import { Check, ChevronDown } from 'lucide-react'
import type { FieldValues } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { SelectOption } from '@/types/common.types'
import { cn } from '@/utils/cn'
import { Field, type FieldProps } from '../field'

type BaseProps<TValues extends FieldValues> = Omit<FieldProps<TValues>, 'children'>

/** Radix Select rejects an empty string value, so "unset" needs a sentinel. */
const EMPTY = '__empty'

export interface SelectFieldProps<TValues extends FieldValues> extends BaseProps<TValues> {
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  /** Offer an explicit "none" entry that clears the value. */
  clearable?: boolean
  clearLabel?: string
}

/** Single choice from a list. */
export function SelectField<TValues extends FieldValues>({
  options,
  placeholder = 'Select…',
  disabled,
  clearable = false,
  clearLabel = 'None',
  ...fieldProps
}: SelectFieldProps<TValues>) {
  return (
    <Field {...fieldProps}>
      {(field, ids) => (
        <Select
          value={field.value === undefined || field.value === '' ? EMPTY : String(field.value)}
          onValueChange={(next) => field.onChange(next === EMPTY ? undefined : next)}
          disabled={disabled ?? field.disabled}
        >
          <SelectTrigger
            id={ids.id}
            aria-describedby={ids['aria-describedby']}
            aria-invalid={ids['aria-invalid']}
            className="w-full"
            onBlur={field.onBlur}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>

          <SelectContent>
            {clearable && <SelectItem value={EMPTY}>{clearLabel}</SelectItem>}
            {options.map((option) => (
              <SelectItem
                key={String(option.value)}
                value={String(option.value)}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Field>
  )
}

export interface MultiSelectFieldProps<TValues extends FieldValues> extends BaseProps<TValues> {
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  /** Collapse to "+N more" beyond this many chips. */
  maxVisibleChips?: number
}

/**
 * Several choices from a list, held as an array.
 *
 * Built from Popover + checkboxes rather than a native multi-select, which is
 * close to unusable on touch and cannot show what is chosen without opening.
 */
export function MultiSelectField<TValues extends FieldValues>({
  options,
  placeholder = 'Select…',
  disabled,
  maxVisibleChips = 3,
  ...fieldProps
}: MultiSelectFieldProps<TValues>) {
  return (
    <Field {...fieldProps}>
      {(field, ids) => {
        const selected: string[] = Array.isArray(field.value) ? field.value.map(String) : []
        const chosen = options.filter((option) => selected.includes(String(option.value)))
        const overflow = chosen.length - maxVisibleChips

        const toggle = (value: string): void => {
          const next = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value]
          field.onChange(next)
        }

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                id={ids.id}
                aria-describedby={ids['aria-describedby']}
                aria-invalid={ids['aria-invalid']}
                disabled={disabled ?? field.disabled}
                onBlur={field.onBlur}
                className={cn(
                  'h-auto min-h-9 w-full justify-between gap-2 px-3 py-1.5 font-normal',
                  'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
                )}
              >
                <span className="flex flex-wrap items-center gap-1">
                  {chosen.length === 0 ? (
                    <span className="text-muted-foreground">{placeholder}</span>
                  ) : (
                    <>
                      {/* Chips are labels, not controls: the trigger is already
                          a button, and nesting another interactive element
                          inside it is invalid and awkward to hit. Deselecting
                          happens in the list below. */}
                      {chosen.slice(0, maxVisibleChips).map((option) => (
                        <Badge key={String(option.value)} variant="secondary">
                          {option.label}
                        </Badge>
                      ))}
                      {overflow > 0 && <Badge variant="outline">+{overflow} more</Badge>}
                    </>
                  )}
                </span>

                <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
              </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-1">
              <ul
                role="listbox"
                aria-multiselectable="true"
                className="max-h-64 overflow-y-auto"
              >
                {options.map((option) => {
                  const value = String(option.value)
                  const isChecked = selected.includes(value)

                  return (
                    <li key={value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isChecked}
                        disabled={option.disabled}
                        onClick={() => toggle(value)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none',
                          'hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50',
                        )}
                      >
                        {/* Visual only — the row itself is the control, so a
                            real Checkbox here would be a button inside a
                            button. */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            'grid size-4 shrink-0 place-items-center rounded-[4px] border',
                            isChecked
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input',
                          )}
                        >
                          {isChecked && <Check className="size-3" />}
                        </span>
                        <span className="flex-1">{option.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </PopoverContent>
          </Popover>
        )
      }}
    </Field>
  )
}

export interface RadioFieldProps<TValues extends FieldValues> extends BaseProps<TValues> {
  options: SelectOption[]
  disabled?: boolean
  /** Lay the options out in a row instead of a column. */
  horizontal?: boolean
}

/** One choice from a small set, all visible at once. */
export function RadioField<TValues extends FieldValues>({
  options,
  disabled,
  horizontal = false,
  ...fieldProps
}: RadioFieldProps<TValues>) {
  return (
    <Field {...fieldProps}>
      {(field, ids) => (
        <RadioGroup
          value={field.value === undefined ? '' : String(field.value)}
          onValueChange={field.onChange}
          disabled={disabled ?? field.disabled}
          aria-describedby={ids['aria-describedby']}
          aria-invalid={ids['aria-invalid']}
          className={cn(horizontal && 'flex flex-wrap gap-4')}
        >
          {options.map((option) => {
            const value = String(option.value)
            const optionId = `${ids.id}-${value}`

            return (
              <div key={value} className="flex items-start gap-2.5">
                <RadioGroupItem value={value} id={optionId} disabled={option.disabled} />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor={optionId} className="font-normal">
                    {option.label}
                  </Label>
                  {option.description && (
                    <span className="text-caption text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </RadioGroup>
      )}
    </Field>
  )
}

type ToggleProps<TValues extends FieldValues> = BaseProps<TValues> & { disabled?: boolean }

/** A single boolean, rendered as a checkbox. */
export function CheckboxField<TValues extends FieldValues>({
  disabled,
  ...fieldProps
}: ToggleProps<TValues>) {
  return (
    <Field {...fieldProps} inline>
      {(field, ids) => (
        <Checkbox
          id={ids.id}
          aria-describedby={ids['aria-describedby']}
          aria-invalid={ids['aria-invalid']}
          checked={Boolean(field.value)}
          onCheckedChange={(checked) => field.onChange(checked === true)}
          onBlur={field.onBlur}
          disabled={disabled ?? field.disabled}
          className="mt-0.5"
        />
      )}
    </Field>
  )
}

/** A single boolean, rendered as a switch — for settings that apply at once. */
export function SwitchField<TValues extends FieldValues>({
  disabled,
  ...fieldProps
}: ToggleProps<TValues>) {
  return (
    <Field {...fieldProps} inline>
      {(field, ids) => (
        <Switch
          id={ids.id}
          aria-describedby={ids['aria-describedby']}
          aria-invalid={ids['aria-invalid']}
          checked={Boolean(field.value)}
          onCheckedChange={field.onChange}
          onBlur={field.onBlur}
          disabled={disabled ?? field.disabled}
          className="mt-0.5"
        />
      )}
    </Field>
  )
}
