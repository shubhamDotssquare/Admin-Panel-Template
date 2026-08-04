import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { PATHS, route } from '@/router/paths'
import type { NavGroup, NavItem } from '@/types/navigation.types'

/**
 * The sidebar, as data.
 *
 * This is the map of the panel: every planned module has its entry and its
 * reserved path. Paths without a registered module resolve to the
 * "module not implemented" placeholder, so the shell is navigable from day one
 * and each module can be filled in independently.
 *
 * To activate a module: create `src/modules/<id>/`, export its
 * `ModuleDefinition`, and register it in `@/modules/registry`. The nav entry
 * below then starts resolving to real screens — no change needed here.
 */
export const NAVIGATION: NavGroup[] = [
  {
    id: 'overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: PATHS.dashboard,
        icon: LayoutDashboard,
      },
      {
        id: 'analytics',
        label: 'Analytics',
        path: PATHS.analytics,
        icon: BarChart3,
      },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      {
        id: 'user-manager',
        label: 'User Manager',
        icon: Users,
        children: [
          { id: 'user-list', label: 'All Users', path: PATHS.userManager },
          { id: 'user-groups', label: 'Groups', path: route(PATHS.userManager, 'groups') },
        ],
      },
      {
        id: 'admin-manager',
        label: 'Admin Manager',
        icon: ShieldCheck,
        children: [
          { id: 'admin-list', label: 'Administrators', path: PATHS.adminManager },
          { id: 'admin-roles', label: 'Roles', path: route(PATHS.adminManager, 'roles') },
          {
            id: 'admin-permissions',
            label: 'Permissions',
            path: route(PATHS.adminManager, 'permissions'),
          },
        ],
      },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      {
        id: 'cms',
        label: 'CMS',
        icon: FileText,
        children: [
          { id: 'cms-pages', label: 'Pages', path: PATHS.cms },
          { id: 'cms-media', label: 'Media Library', path: route(PATHS.cms, 'media') },
        ],
      },
      {
        id: 'email-templates',
        label: 'Email Templates',
        path: PATHS.emailTemplates,
        icon: Mail,
      },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    items: [
      {
        id: 'enquiry-manager',
        label: 'Enquiry Manager',
        path: PATHS.enquiryManager,
        icon: MessageSquare,
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        children: [
          { id: 'settings-general', label: 'General', path: PATHS.settings },
          {
            id: 'settings-appearance',
            label: 'Appearance',
            path: route(PATHS.settings, 'appearance'),
          },
        ],
      },
      {
        id: 'help-support',
        label: 'Help & Support',
        path: PATHS.helpSupport,
        icon: LifeBuoy,
      },
    ],
  },
]

/** Depth-first walk over every item, including nested children. */
export function flattenNavigation(groups: NavGroup[] = NAVIGATION): NavItem[] {
  const walk = (items: NavItem[]): NavItem[] =>
    items.flatMap((item) => [item, ...(item.children ? walk(item.children) : [])])

  return groups.flatMap((group) => walk(group.items))
}

function ownsPath(item: NavItem, pathname: string): boolean {
  if (item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`))) return true
  return Boolean(item.children?.some((child) => ownsPath(child, pathname)))
}

/** Find the nav entry that owns a given pathname, longest match first. */
export function findNavItemByPath(
  pathname: string,
  groups: NavGroup[] = NAVIGATION,
): NavItem | undefined {
  return flattenNavigation(groups)
    .filter((item): item is NavItem & { path: string } => Boolean(item.path))
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
}

/**
 * Find the *top-level* nav entry containing a pathname.
 *
 * A child route like `/cms/media` belongs to the CMS module, so this is what
 * identifies the module folder that should own a path.
 */
export function findNavRootByPath(
  pathname: string,
  groups: NavGroup[] = NAVIGATION,
): NavItem | undefined {
  return groups.flatMap((group) => group.items).find((item) => ownsPath(item, pathname))
}
