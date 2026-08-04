/**
 * API endpoint paths, relative to `env.apiBaseUrl`.
 *
 * Only cross-cutting endpoints belong here. A module's own endpoints live in
 * that module's `services/` folder so the module stays self-contained.
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  uploads: {
    single: '/uploads',
  },
} as const
