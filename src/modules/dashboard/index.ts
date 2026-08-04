import { lazy } from 'react'

import { PATHS } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const DashboardPage = lazy(() => import('./pages/dashboard-page'))

/**
 * Reference module. Copy this shape for Admin Manager, User Manager, CMS, and
 * the rest — see `src/modules/README.md`.
 */
export const dashboardModule: ModuleDefinition = {
  id: 'dashboard',
  title: 'Dashboard',
  basePath: PATHS.dashboard,
  enabled: true,
  routes: [{ path: PATHS.dashboard, Component: DashboardPage }],
}

export default dashboardModule
