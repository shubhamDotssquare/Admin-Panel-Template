/**
 * Every localStorage / sessionStorage key used by the app.
 *
 * Centralised so keys can be namespaced and audited in one place — never
 * inline a raw string at the call site.
 */

const NAMESPACE = 'admin'

export const STORAGE_KEYS = {
  theme: `${NAMESPACE}:theme`,
  sidebarCollapsed: `${NAMESPACE}:sidebar-collapsed`,
  authToken: `${NAMESPACE}:auth-token`,
  refreshToken: `${NAMESPACE}:refresh-token`,
  locale: `${NAMESPACE}:locale`,
  tablePreferences: `${NAMESPACE}:table-preferences`,
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
