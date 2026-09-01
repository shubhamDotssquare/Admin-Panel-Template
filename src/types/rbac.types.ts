/**
 * Roles, permissions and resources.
 *
 * Permission keys are plain strings (`admins.read`, `roles.update`) rather than
 * a union, because roles are editable and new permissions are seeded
 * server-side — a closed union would go stale the first time the backend adds
 * one, and would tempt the UI into hardcoding role *names*.
 */
export type PermissionKey = string

/** One role held by an admin, as returned with their permissions. */
export interface AssignedRole {
  roleId: string
  roleName: string
  roleKey: string
  isActive: boolean
  assignedAt?: string
}

/** `GET /rbac/me/permissions` — and the same shape per admin. */
export interface EffectivePermissions {
  roles: AssignedRole[]
  /** Flattened across every role, including anything inherited via `parentId`. */
  effectivePermissions: PermissionKey[]
}

export interface RoleSummary {
  id: string
  name: string
  /** Lowercase letters, digits and underscores only. */
  key: string
  description?: string | null
  level?: number | null
  isActive: boolean
  /** Seeded roles the API refuses to delete. */
  isSystem: boolean
  parentId?: string | null
  parentName?: string | null
  createdAt?: string
  updatedAt?: string
}

/** `GET /rbac/roles/:id` — adds the permissions attached *directly* to the role. */
export interface RoleDetail extends RoleSummary {
  /** Directly attached only; anything inherited from `parentId` is not listed. */
  permissions: Permission[]
}

export interface CreateRoleDto {
  name: string
  key: string
  description?: string
  level?: number
  parentId?: string | null
  isActive?: boolean
}

export type UpdateRoleDto = Partial<CreateRoleDto>

/** A module the permissions belong to — seeded, never edited from the panel. */
export interface Resource {
  id: string
  name: string
  key?: string
  description?: string | null
}

export interface Permission {
  id: string
  /** The key checked in the UI, e.g. `admins.read`. */
  key: PermissionKey
  name?: string
  description?: string | null
  resourceId?: string
  resourceName?: string
  action?: string
}

/**
 * Permission keys this panel's screens gate on.
 *
 * A convenience for call sites, not an allow-list: `can()` takes any string, and
 * the server remains the only real enforcement.
 */
export const PERMISSIONS = {
  adminsRead: 'admins.read',
  adminsCreate: 'admins.create',
  adminsUpdate: 'admins.update',
  adminsDelete: 'admins.delete',

  usersRead: 'users.read',
  usersCreate: 'users.create',
  usersUpdate: 'users.update',
  usersDelete: 'users.delete',

  rolesRead: 'roles.read',
  rolesCreate: 'roles.create',
  rolesUpdate: 'roles.update',
  rolesDelete: 'roles.delete',

  permissionsRead: 'permissions.read',

  enquiriesRead: 'enquiries.read',
  enquiriesCreate: 'enquiries.create',
  enquiriesUpdate: 'enquiries.update',
  enquiriesDelete: 'enquiries.delete',

  supportTicketsRead: 'support_tickets.read',
  supportTicketsCreate: 'support_tickets.create',
  supportTicketsUpdate: 'support_tickets.update',
  supportTicketsDelete: 'support_tickets.delete',

  cmsPagesRead: 'cms_pages.read',
  cmsPagesCreate: 'cms_pages.create',
  cmsPagesUpdate: 'cms_pages.update',
  cmsPagesDelete: 'cms_pages.delete',

  blogPostsRead: 'blog_posts.read',
  blogPostsCreate: 'blog_posts.create',
  blogPostsUpdate: 'blog_posts.update',
  blogPostsDelete: 'blog_posts.delete',

  faqsRead: 'faqs.read',
  faqsCreate: 'faqs.create',
  faqsUpdate: 'faqs.update',
  faqsDelete: 'faqs.delete',

  emailTemplatesRead: 'email_templates.read',
  emailTemplatesCreate: 'email_templates.create',
  emailTemplatesUpdate: 'email_templates.update',
  emailTemplatesDelete: 'email_templates.delete',

  notificationsRead: 'notifications.read',
  notificationsCreate: 'notifications.create',
  notificationsUpdate: 'notifications.update',
  notificationsDelete: 'notifications.delete',

  featureFlagsRead: 'feature_flags.read',
  featureFlagsCreate: 'feature_flags.create',
  featureFlagsUpdate: 'feature_flags.update',
  featureFlagsDelete: 'feature_flags.delete',

  settingsRead: 'settings.read',
  settingsUpdate: 'settings.update',

  revenueAnalyticsRead: 'revenue_analytics.read',
  revenueAnalyticsCreate: 'revenue_analytics.create',
  revenueAnalyticsUpdate: 'revenue_analytics.update',
  revenueAnalyticsDelete: 'revenue_analytics.delete',

  deviceAnalyticsRead: 'device_analytics.read',
  deviceAnalyticsCreate: 'device_analytics.create',
  deviceAnalyticsUpdate: 'device_analytics.update',
  deviceAnalyticsDelete: 'device_analytics.delete',

  locationAnalyticsRead: 'location_analytics.read',
  locationAnalyticsCreate: 'location_analytics.create',
  locationAnalyticsUpdate: 'location_analytics.update',
  locationAnalyticsDelete: 'location_analytics.delete',

  activityFeedRead: 'activity_feed.read',
  activityFeedCreate: 'activity_feed.create',
  activityFeedUpdate: 'activity_feed.update',
  activityFeedDelete: 'activity_feed.delete',

  auditLogsRead: 'audit_logs.read',

  dashboardRead: 'dashboard.read',

  notesRead: 'notes.read',
  notesCreate: 'notes.create',
  notesUpdate: 'notes.update',
  notesDelete: 'notes.delete',
} as const
