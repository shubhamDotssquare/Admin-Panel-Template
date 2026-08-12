import type { StatusMap } from '@/components/patterns'

/** Lifecycle of a staff account. */
export type AdminStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED'

export interface Admin {
  id: string
  firstName: string
  lastName: string
  email: string
  status: AdminStatus
  /** Role ids. An administrator may hold several. */
  roles: string[]
  lastLoginAt?: string | null
  createdAt?: string
}

export interface CreateAdminDto {
  firstName: string
  lastName: string
  email: string
  status: AdminStatus
  roles: string[]
}

export type UpdateAdminDto = CreateAdminDto

export interface Role {
  id: string
  name: string
  description?: string
  /** Permission keys this role grants. */
  permissions: string[]
  /** How many administrators hold it — drives the "in use" warning. */
  adminCount?: number
  /** Built-in roles cannot be deleted. */
  system?: boolean
}

export const ADMIN_STATUS: StatusMap<AdminStatus> = {
  ACTIVE: { label: 'Active', tone: 'success', description: 'Can sign in to the panel.' },
  INVITED: {
    label: 'Invited',
    tone: 'info',
    description: 'Invitation sent, not yet accepted.',
  },
  SUSPENDED: {
    label: 'Suspended',
    tone: 'destructive',
    description: 'Blocked from signing in.',
  },
}

export const ADMIN_STATUS_OPTIONS = (Object.keys(ADMIN_STATUS) as AdminStatus[]).map(
  (value) => ({ label: ADMIN_STATUS[value].label, value }),
)

export function adminFullName(admin: Pick<Admin, 'firstName' | 'lastName' | 'email'>): string {
  const full = [admin.firstName, admin.lastName].filter(Boolean).join(' ').trim()
  return full || admin.email
}
