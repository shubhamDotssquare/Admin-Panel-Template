/**
 * Every route path in the application.
 *
 * Nothing else in the codebase should contain a hard-coded URL string. Modules
 * add their own section here so links stay refactor-safe.
 */
export const PATHS = {
  root: '/',

  // Unauthenticated screens (rendered inside AuthLayout).
  auth: {
    login: '/login',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    register: '/register',
    /** Target of the emailed confirmation link; reads `?token=`. */
    verifyEmail: '/verify-email',
  },

  // Shell screens (rendered inside AdminLayout).
  dashboard: '/dashboard',
  profile: '/profile',

  // Reserved prefixes for the planned modules. Each becomes the `basePath` of
  // its module definition; children are declared by the module itself.
  adminManager: '/admin-manager',
  userManager: '/users',
  cms: '/cms',
  settings: '/settings',
  enquiryManager: '/enquiries',
  emailTemplates: '/email-templates',
  helpSupport: '/help',
  analytics: '/analytics',

  // Terminal states.
  forbidden: '/403',
  notFound: '/404',
} as const

/** Join a module base path with a child segment: `route(PATHS.cms, 'pages')`. */
export function route(base: string, ...segments: Array<string | number>): string {
  const tail = segments
    .map((segment) => String(segment).replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')

  const normalisedBase = base.replace(/\/+$/, '')
  return tail ? `${normalisedBase}/${tail}` : normalisedBase
}
