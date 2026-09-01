import type { StatusMap } from '@/components/patterns'

/** Lifecycle of an end-user record. */
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED'

/**
 * `UserProfile` from the API.
 *
 * These are records an admin manages — a customer/contact list. They have no
 * password and never sign in themselves, which is why there is no role field
 * and nothing here about sessions.
 */
export interface User {
  id: string
  email: string
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  status: UserStatus
  emailVerified?: boolean
  lastLoginAt?: string | null
  lastLoginIp?: string | null
  /** Free-form JSON. **Replaced wholesale on update**, never merged. */
  metadata?: Record<string, unknown> | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserDto {
  email: string
  phone?: string
  firstName?: string
  lastName?: string
  status?: UserStatus
  metadata?: Record<string, unknown>
}

export type UpdateUserDto = Partial<CreateUserDto>

export const USER_STATUS: StatusMap<UserStatus> = {
  ACTIVE: { label: 'Active', tone: 'success' },
  PENDING: { label: 'Pending', tone: 'warning', description: 'Created but not yet activated.' },
  INACTIVE: { label: 'Inactive', tone: 'neutral' },
  SUSPENDED: { label: 'Suspended', tone: 'destructive' },
}

export const USER_STATUS_OPTIONS = (Object.keys(USER_STATUS) as UserStatus[]).map((value) => ({
  label: USER_STATUS[value].label,
  value,
}))

export function userFullName(user: Pick<User, 'firstName' | 'lastName' | 'email'>): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return full || user.email
}
