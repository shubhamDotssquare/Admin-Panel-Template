import { PATHS } from '@/router/paths'
import { env } from './env'

/**
 * Framework-level behaviour. Rebranding or repurposing the template should not
 * require touching anything outside this file and `@/styles/tokens.css`.
 */
export const appConfig = {
  name: env.appName,
  shortName: env.appShortName,
  description: 'Reusable administration panel',

  /** Where an authenticated user lands. */
  homePath: PATHS.dashboard,
  /** Where an unauthenticated user is sent. */
  loginPath: PATHS.auth.login,

  auth: {
    /** While false, route guards pass everything through. */
    enabled: env.authEnabled,
    /** Query param used to return the user to their original destination. */
    redirectParam: 'redirectTo',
    /**
     * Password policy, mirroring the server's. Enforced client-side for fast
     * feedback only — the server remains the source of truth.
     */
    passwordMinLength: 10,
    passwordMaxLength: 72,
    /** Query param carrying the reset token from the emailed link. */
    resetTokenParam: 'token',
  },

  api: {
    baseUrl: env.apiBaseUrl,
    timeout: env.apiTimeout,
  },

  layout: {
    /** Sidebar starts collapsed on first visit. */
    defaultSidebarCollapsed: false,
    /** Render the breadcrumb trail in the header. */
    showBreadcrumbs: true,
    /** Render the header search trigger and its ⌘K palette. */
    showSearch: true,
    /** Render the header notification panel. */
    showNotifications: true,
    /** Constrain page content to `--layout-content-max-width`. */
    constrainContentWidth: true,
  },

  support: {
    email: env.supportEmail,
  },

  /** Appended to every document title as `Page · Admin Panel`. */
  titleSeparator: ' · ',
} as const

export type AppConfig = typeof appConfig
