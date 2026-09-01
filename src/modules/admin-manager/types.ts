import type { StatusMap } from '@/components/patterns'

/** Lifecycle of an admin account, as the API defines it. */
export type AdminStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED'

/**
 * The account's built-in role tier.
 *
 * Distinct from RBAC roles: this is a single field on the record, while an
 * admin separately holds any number of assignable roles under `/rbac`. Both
 * exist, and the UI shows them in different places — this one on the profile
 * form, the RBAC ones under "Manage roles".
 */
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'

/** `AdminProfile` from the API. */
export interface Admin {
  id: string
  email: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  role: AdminRole
  status: AdminStatus
  emailVerified?: boolean
  phoneVerified?: boolean
  lastLoginAt?: string | null
  lastLoginIp?: string | null
  createdAt?: string
  updatedAt?: string
}

/** `POST /admins` — the only place a password is ever sent. */
export interface CreateAdminDto {
  email: string
  password: string
  username?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: AdminRole
  status?: AdminStatus
}

/** `PATCH /admins/:id` — same fields, all optional, and **never** a password. */
export type UpdateAdminDto = Omit<Partial<CreateAdminDto>, 'password'>

export const ADMIN_STATUS: StatusMap<AdminStatus> = {
  ACTIVE: { label: 'Active', tone: 'success', description: 'Can sign in to the panel.' },
  PENDING: { label: 'Pending', tone: 'warning', description: 'Awaiting confirmation.' },
  INACTIVE: { label: 'Inactive', tone: 'neutral', description: 'Deactivated; sessions ended.' },
  SUSPENDED: {
    label: 'Suspended',
    tone: 'destructive',
    description: 'Blocked; sessions ended.',
  },
}

export const ADMIN_STATUS_OPTIONS = (Object.keys(ADMIN_STATUS) as AdminStatus[]).map(
  (value) => ({ label: ADMIN_STATUS[value].label, value }),
)

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  USER: 'User',
}

export const ADMIN_ROLE_OPTIONS = (Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map(
  (value) => ({ label: ADMIN_ROLE_LABELS[value], value }),
)

export function adminFullName(admin: Pick<Admin, 'firstName' | 'lastName' | 'email'>): string {
  const full = [admin.firstName, admin.lastName].filter(Boolean).join(' ').trim()
  return full || admin.email
}

/**
 * `GET /rbac/permissions` item, exactly as the endpoint returns it — nested
 * `resource`, not the flattened `resourceId`/`resourceName` that
 * `rbac.types.ts`'s `Permission` carries for the role editor's picker.
 *
 * Read-only reference data: no create/update/delete endpoint exists for it.
 */
export interface PermissionRecord {
  id: string
  /** e.g. `admins.read`. */
  key: string
  action?: string
  description?: string | null
  resource: {
    id: string
    key: string
    name: string
  }
  createdAt: string
}
