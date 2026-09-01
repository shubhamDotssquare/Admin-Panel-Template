import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const RevenueListPage = lazy(() => import('./pages/revenue-list-page'))
const LocationListPage = lazy(() => import('./pages/location-list-page'))
const DeviceListPage = lazy(() => import('./pages/device-list-page'))

/**
 * Three tiny, flat analytics resources — revenue, location, device — each a
 * plain list-plus-modal-editor screen. No charting library is in this project,
 * so there is nothing here beyond CRUD tables, and no `:id` routes: every
 * record is edited through its list's modal, never a dedicated page.
 */
export const analyticsModule: ModuleDefinition = {
  id: 'analytics',
  title: 'Analytics',
  basePath: PATHS.analytics,
  enabled: true,
  routes: [
    { path: PATHS.analytics, Component: RevenueListPage },
    { path: route(PATHS.analytics, 'location'), Component: LocationListPage },
    { path: route(PATHS.analytics, 'device'), Component: DeviceListPage },
  ],
}

export default analyticsModule
