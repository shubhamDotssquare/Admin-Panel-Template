import type { AuthUser } from '@/types/auth.types'

/**
 * The best human-readable name available for an account.
 *
 * Every field but `email` is optional on the API, so this degrades in order:
 * full name → either name → username → the local part of the email. It never
 * returns an empty string, because callers render it directly into avatars and
 * menus where a blank would look broken.
 */
export function displayName(
  user: Pick<AuthUser, 'firstName' | 'lastName' | 'username' | 'email'>,
): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  if (full) return full

  if (user.username?.trim()) return user.username.trim()

  return user.email.split('@')[0] || user.email
}
