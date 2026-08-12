import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const AdminListPage = lazy(() => import('./pages/admin-list-page'))
const AdminDetailPage = lazy(() => import('./pages/admin-detail-page'))
const AdminFormPage = lazy(() => import('./pages/admin-form-page'))
const RoleListPage = lazy(() => import('./pages/role-list-page'))

/**
 * Staff accounts and the roles they hold: list, profile, invite, edit, status
 * management and role assignment.
 *
 * `new` and `roles` are static segments, which React Router ranks above the
 * `:adminId` pattern — so neither can be mistaken for an administrator id.
 */
export const adminManagerModule: ModuleDefinition = {
  id: 'admin-manager',
  title: 'Admin Manager',
  basePath: PATHS.adminManager,
  enabled: true,
  routes: [
    { path: PATHS.adminManager, Component: AdminListPage },
    { path: route(PATHS.adminManager, 'new'), Component: AdminFormPage },
    { path: route(PATHS.adminManager, 'roles'), Component: RoleListPage },
    { path: route(PATHS.adminManager, ':adminId'), Component: AdminDetailPage },
    { path: route(PATHS.adminManager, ':adminId', 'edit'), Component: AdminFormPage },
  ],
}

export default adminManagerModule
