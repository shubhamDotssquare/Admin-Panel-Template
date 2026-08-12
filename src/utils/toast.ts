import { toast } from 'sonner'

import { toErrorMessage } from '@/services/api-error'

interface NotifyOptions {
  description?: string
  /** Milliseconds; omit to use the app-wide default. */
  duration?: number
  action?: { label: string; onClick: () => void }
}

/**
 * The app's toast vocabulary.
 *
 * Sonner is called through here rather than imported at call sites, so tone,
 * duration and copy conventions live in one place — and swapping the toast
 * library later is one file, not a grep across every module.
 *
 * Convention: **toasts confirm, they do not validate.** Field problems belong on
 * the field (`Field`) and whole-form failures in the form banner
 * (`FormMessage`); a toast is for the outcome of an action the user has already
 * committed to — saved, deleted, invited, exported.
 */
export const notify = {
  success: (message: string, options?: NotifyOptions) => toast.success(message, options),
  error: (message: string, options?: NotifyOptions) => toast.error(message, options),
  info: (message: string, options?: NotifyOptions) => toast.info(message, options),
  warning: (message: string, options?: NotifyOptions) => toast.warning(message, options),

  /** Indeterminate work. Dismiss with the returned id, or hand it to `settle`. */
  loading: (message: string, options?: NotifyOptions) => toast.loading(message, options),

  dismiss: (id?: string | number) => toast.dismiss(id),

  /**
   * Report a caught error using whatever message the API supplied. Pairs with
   * the `ApiError` thrown by the http client.
   *
   * The server's message leads, because it is the specific one: "This record is
   * protected and cannot be deleted" tells the user what happened, while a
   * generic title with that buried underneath makes them read twice. Pass a
   * `title` only when the call site knows something the error does not — which
   * action failed, say — and the message becomes the supporting line.
   */
  fromError: (error: unknown, title?: string) => {
    const message = toErrorMessage(error)
    return title ? toast.error(title, { description: message }) : toast.error(message)
  },

  /**
   * Bind one toast to a promise's lifecycle — loading, then success or error.
   *
   * ```ts
   * notify.promise(userService.remove(id), {
   *   loading: 'Deleting user…',
   *   success: 'User deleted',
   *   error: 'Could not delete the user',
   * })
   * ```
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      /** Defaults to the error's own message. */
      error?: string | ((error: unknown) => string)
    },
  ) =>
    toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: (error: unknown) => {
        if (typeof messages.error === 'function') return messages.error(error)
        return messages.error ?? toErrorMessage(error)
      },
    }),
}

export type Notify = typeof notify
