import type { StatusMap } from '@/components/patterns'

/** Lifecycle of an end-user account. */
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  status: UserStatus
  /** Group ids this user belongs to. */
  groups?: string[]
  emailVerified?: boolean
  lastLoginAt?: string | null
  createdAt?: string
  notes?: string | null
}

/** What the create form sends. */
export interface CreateUserDto {
  firstName: string
  lastName: string
  email: string
  phone?: string
  status: UserStatus
  groups?: string[]
  notes?: string
}

export type UpdateUserDto = CreateUserDto

/**
 * The module owns its status vocabulary; the shared `StatusBadge` owns how each
 * tone looks. That split is what lets every module read consistently without
 * agreeing on a single enum.
 */
export const USER_STATUS: StatusMap<UserStatus> = {
  ACTIVE: { label: 'Active', tone: 'success', description: 'Can sign in and use the panel.' },
  PENDING: {
    label: 'Pending',
    tone: 'warning',
    description: 'Waiting for the account to be confirmed.',
  },
  SUSPENDED: {
    label: 'Suspended',
    tone: 'destructive',
    description: 'Blocked from signing in until reinstated.',
  },
  INACTIVE: { label: 'Inactive', tone: 'neutral', description: 'Dormant or closed.' },
}

export const USER_STATUS_OPTIONS = (Object.keys(USER_STATUS) as UserStatus[]).map((value) => ({
  label: USER_STATUS[value].label,
  value,
}))

/** Placeholder groups until a Groups screen owns them. */
export const USER_GROUP_OPTIONS = [
  { label: 'Customers', value: 'customers' },
  { label: 'Beta testers', value: 'beta' },
  { label: 'Partners', value: 'partners' },
  { label: 'Internal', value: 'internal' },
]

export function userFullName(user: Pick<User, 'firstName' | 'lastName' | 'email'>): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return full || user.email
}
