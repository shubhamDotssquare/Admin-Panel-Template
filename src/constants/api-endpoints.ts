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
  uploads: {
    single: '/uploads',
  },
} as const
