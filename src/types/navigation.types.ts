import type { IconComponent } from './common.types'

/** One clickable entry in the sidebar. */
export interface NavItem {
  /** Stable id — also used as the React key and for permission lookups. */
  id: string
  label: string
  /** Absolute path from `@/router/paths`. Omit for a pure parent node. */
  path?: string
  icon?: IconComponent
  /** Nested entries, rendered as a collapsible group. */
  children?: NavItem[]
  /** Short text rendered on the right of the row (counts, "New", …). */
  badge?: string
  /** Opens in a new tab instead of routing. */
  external?: boolean
  /** Permission keys the current user must hold for this entry to render. */
  permissions?: string[]
  /** Hide without deleting — useful while a module is being built. */
  hidden?: boolean
}

/** A labelled section of the sidebar. */
export interface NavGroup {
  id: string
  /** Section heading; omit for an unlabelled group. */
  label?: string
  items: NavItem[]
}

/** One crumb in the header breadcrumb trail. */
export interface BreadcrumbItem {
  label: string
  path?: string
}
