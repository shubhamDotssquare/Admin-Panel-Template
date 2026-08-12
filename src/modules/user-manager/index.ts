import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const UserListPage = lazy(() => import('./pages/user-list-page'))
const UserDetailPage = lazy(() => import('./pages/user-detail-page'))
const UserFormPage = lazy(() => import('./pages/user-form-page'))

/**
 * End-user accounts: list, profile, create, edit and status management.
 *
 * `new` is declared before `:userId` for readability; React Router ranks static
 * segments above dynamic ones regardless, so `/users/new` can never be read as
 * a user whose id is "new".
 */
export const userManagerModule: ModuleDefinition = {
  id: 'user-manager',
  title: 'User Manager',
  basePath: PATHS.userManager,
  enabled: true,
  routes: [
    { path: PATHS.userManager, Component: UserListPage },
    { path: route(PATHS.userManager, 'new'), Component: UserFormPage },
    { path: route(PATHS.userManager, ':userId'), Component: UserDetailPage },
    { path: route(PATHS.userManager, ':userId', 'edit'), Component: UserFormPage },
  ],
}

export default userManagerModule
