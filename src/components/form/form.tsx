import {
  FormProvider,
  useForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'

import { FormMessage } from '@/components/common/form-message'
import { isApiError, toErrorMessage } from '@/services/api-error'
import type { FieldErrors as ApiFieldErrors } from '@/types/api.types'
import { cn } from '@/utils/cn'

export type UseAppFormOptions<TValues extends FieldValues> = Omit<
  UseFormProps<TValues>,
  'resolver'
> & {
  /**
   * Input and output are the same type on purpose. Zod transforms that change
   * a field's shape make the form's values diverge from its schema, which is a
   * sharp edge in exchange for very little — do the conversion in `onSubmit`.
   */
  schema: z.ZodType<TValues, TValues>
}

/**
 * `useForm` with the Zod resolver already wired.
 *
 * Zod is the single source of truth for a form's shape *and* its rules, so the
 * value types come from the schema rather than being declared twice.
 */
export function useAppForm<TValues extends FieldValues>({
  schema,
  ...options
}: UseAppFormOptions<TValues>): UseFormReturn<TValues> {
  return useForm<TValues>({
    resolver: zodResolver(schema),
    // Quiet until the user submits, then live while they correct.
    //
    // Not `onTouched`, which looks tempting but is wrong here: in that mode RHF
    // keeps errors only for fields the user has already visited, so a first
    // submit on an untouched form reports one problem instead of all of them.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    ...options,
  })
}

/** Map `{ email: ['Already taken'] }` from the API onto form fields. */
function applyFieldErrors<TValues extends Record<string, unknown>>(
  form: UseFormReturn<TValues>,
  fieldErrors: ApiFieldErrors,
): boolean {
  let matched = false

  for (const [field, messages] of Object.entries(fieldErrors)) {
    const message = messages?.[0]
    if (!message) continue

    form.setError(field as never, { type: 'server', message })
    matched = true
  }

  return matched
}

export interface FormProps<TValues extends Record<string, unknown>> {
  form: UseFormReturn<TValues>
  /**
   * Runs with validated values; the engine awaits whatever it returns.
   *
   * Throwing marks the submit as failed: an `ApiError` carrying `fieldErrors`
   * lands on the fields it names, anything else becomes the banner.
   */
  onSubmit: (values: TValues) => unknown
  children: React.ReactNode
  mapError?: (error: unknown) => { message: string; fieldErrors?: ApiFieldErrors }
  /** Hide the automatic error banner to place it yourself. */
  hideErrorBanner?: boolean
  className?: string
  id?: string
}

/**
 * The form element, its context, and its failure handling.
 *
 * Server-side validation is a first-class outcome: a rejected submit whose
 * `ApiError` carries `fieldErrors` is attached to those fields, so client and
 * server errors render through the same UI. Anything unattributed surfaces in
 * the banner via RHF's `root` error, which clears on the next submit.
 */
export function Form<TValues extends Record<string, unknown>>({
  form,
  onSubmit,
  children,
  mapError,
  hideErrorBanner = false,
  className,
  id,
}: FormProps<TValues>) {
  const rootError = form.formState.errors.root?.message

  const handleSubmit = form.handleSubmit(async (values) => {
    form.clearErrors('root')

    try {
      await onSubmit(values as TValues)
    } catch (error) {
      const mapped = mapError?.(error) ?? {
        message: toErrorMessage(error),
        fieldErrors: isApiError(error) ? error.fieldErrors : undefined,
      }

      // Only fall back to the banner when no field claimed the failure,
      // otherwise the same problem is reported twice.
      if (!mapped.fieldErrors || !applyFieldErrors(form, mapped.fieldErrors)) {
        form.setError('root', { type: 'server', message: mapped.message })
      }
    }
  })

  return (
    <FormProvider {...form}>
      <form
        id={id}
        onSubmit={handleSubmit}
        // The browser's own bubbles would pre-empt Zod and look nothing like
        // the rest of the panel.
        noValidate
        className={cn('flex flex-col gap-field', className)}
      >
        {!hideErrorBanner && <FormMessage>{rootError}</FormMessage>}
        {children}
      </form>
    </FormProvider>
  )
}
