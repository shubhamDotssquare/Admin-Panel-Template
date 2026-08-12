import { z } from 'zod'

import { appConfig } from '@/config/app.config'

/**
 * Zod building blocks shared across modules.
 *
 * Rules that exist in more than one place live here so they cannot drift — the
 * password policy in particular is mirrored from the server and appears on
 * register, reset and change-password.
 */

/**
 * Pragmatic single-@ check. Deliberately not RFC 5322: the only authority on
 * whether an address exists is sending mail to it, and stricter patterns reject
 * valid addresses.
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Enter a valid email address.')

/** A string that must not be blank. */
export function requiredString(message = 'This field is required.') {
  return z.string().trim().min(1, message)
}

/**
 * The API's password policy, mirrored for fast feedback. The server validates
 * the same rule and remains the source of truth.
 *
 * The upper bound is not cosmetic: bcrypt truncates beyond 72 bytes, so a longer
 * password would silently not mean what the user typed.
 */
export function passwordSchema({
  min = appConfig.auth.passwordMinLength,
  max = appConfig.auth.passwordMaxLength,
  requiredMessage = 'Choose a password.',
}: { min?: number; max?: number; requiredMessage?: string } = {}) {
  return z
    .string()
    .min(1, requiredMessage)
    .min(min, `Must be at least ${min} characters.`)
    .max(max, `Must be ${max} characters or fewer.`)
    .regex(/[A-Z]/, 'Must include an upper-case letter.')
    .regex(/[a-z]/, 'Must include a lower-case letter.')
    .regex(/\d/, 'Must include a number.')
    .regex(/[^A-Za-z0-9]/, 'Must include a symbol.')
}

/**
 * Attach a "these two must match" rule to an object schema.
 *
 * `superRefine` rather than `refine` so the message lands on the confirmation
 * field instead of the form banner — the user needs to know *which* box to fix.
 */
export function withMatchingFields<TSchema extends z.ZodObject<z.ZodRawShape>>(
  schema: TSchema,
  field: string,
  confirmField: string,
  message = 'Passwords do not match.',
) {
  return schema.superRefine((values, ctx) => {
    const record = values as Record<string, unknown>
    if (record[field] !== record[confirmField]) {
      ctx.addIssue({ code: 'custom', message, path: [confirmField] })
    }
  })
}

/** Exactly `length` digits — one-time codes, PINs. */
export function digitsSchema(length: number, message?: string) {
  return z
    .string()
    .regex(new RegExp(`^\\d{${length}}$`), message ?? `Enter the ${length}-digit code.`)
}

/** Text that must parse as JSON. Pairs with `JsonField`, which stores a string. */
export function jsonStringSchema({ optional = true } = {}) {
  return z.string().superRefine((text, ctx) => {
    if (text.trim() === '') {
      if (!optional) ctx.addIssue({ code: 'custom', message: 'This field is required.' })
      return
    }

    try {
      JSON.parse(text)
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Enter valid JSON.' })
    }
  })
}
