/**
 * API endpoint paths, relative to `env.apiBaseUrl`.
 *
 * Only cross-cutting endpoints belong here. A module's own endpoints live in
 * that module's `services/` folder so the module stays self-contained.
 */
export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    refresh: '/auth/refresh',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    sessions: '/auth/sessions',
    /** `DELETE /auth/sessions/:id` — revoke a single device. */
    session: (sessionId: string) => `/auth/sessions/${encodeURIComponent(sessionId)}`,
  },
  /** Admin accounts — "manage other admins", distinct from `/auth/*`. */
  admins: {
    root: '/admins',
    byId: (id: string) => `/admins/${encodeURIComponent(id)}`,
    activate: (id: string) => `/admins/${encodeURIComponent(id)}/activate`,
    deactivate: (id: string) => `/admins/${encodeURIComponent(id)}/deactivate`,
    suspend: (id: string) => `/admins/${encodeURIComponent(id)}/suspend`,
  },

  /** End-user records an admin manages; these users never sign in themselves. */
  users: {
    root: '/users',
    byId: (id: string) => `/users/${encodeURIComponent(id)}`,
    activate: (id: string) => `/users/${encodeURIComponent(id)}/activate`,
    deactivate: (id: string) => `/users/${encodeURIComponent(id)}/deactivate`,
    suspend: (id: string) => `/users/${encodeURIComponent(id)}/suspend`,
  },

  rbac: {
    myPermissions: '/rbac/me/permissions',
    roles: '/rbac/roles',
    role: (id: string) => `/rbac/roles/${encodeURIComponent(id)}`,
    rolePermissions: (id: string) => `/rbac/roles/${encodeURIComponent(id)}/permissions`,
    rolePermission: (roleId: string, permissionId: string) =>
      `/rbac/roles/${encodeURIComponent(roleId)}/permissions/${encodeURIComponent(permissionId)}`,
    permissions: '/rbac/permissions',
    permission: (id: string) => `/rbac/permissions/${encodeURIComponent(id)}`,
    resources: '/rbac/resources',
    resource: (id: string) => `/rbac/resources/${encodeURIComponent(id)}`,
    /** Roles held by one admin. */
    adminRoles: (adminId: string) => `/rbac/admins/${encodeURIComponent(adminId)}/roles`,
    adminRole: (adminId: string, roleId: string) =>
      `/rbac/admins/${encodeURIComponent(adminId)}/roles/${encodeURIComponent(roleId)}`,
  },

  uploads: {
    single: '/uploads',
  },
} as const
