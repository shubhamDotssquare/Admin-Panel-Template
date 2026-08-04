import type { RouteObject } from 'react-router'
import type { NavGroup } from './navigation.types'

/**
 * The contract every feature module implements.
 *
 * A module is self-contained: it owns its routes, its sidebar entries and its
 * own services/types. The shell discovers modules through the registry in
 * `@/modules/registry` and never imports module internals directly — that is
 * what keeps business logic out of the framework.
 */
export interface ModuleDefinition {
  /** Unique, stable identifier (e.g. `user-manager`). */
  id: string
  /** Human label, used in docs and fallback headings. */
  title: string
  /** Path prefix the module owns, e.g. `/users`. */
  basePath: string
  /** Routes mounted inside the admin layout, relative or absolute. */
  routes: RouteObject[]
  /** Sidebar groups this module contributes. */
  navigation?: NavGroup[]
  /** Set false to unmount the module without deleting its code. */
  enabled?: boolean
  /** Permissions required to mount the module at all. */
  permissions?: string[]
}
