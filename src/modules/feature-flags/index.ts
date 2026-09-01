import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const FeatureFlagListPage = lazy(() => import('./pages/feature-flag-list-page'))
const FeatureFlagDetailPage = lazy(() => import('./pages/feature-flag-detail-page'))
const FeatureFlagFormPage = lazy(() => import('./pages/feature-flag-form-page'))

/**
 * Feature flags: list, detail, create, edit and toggle.
 *
 * `new` is declared before `:flagId` for readability; React Router ranks
 * static segments above dynamic ones regardless, so `/feature-flags/new` can
 * never be read as a flag whose id is "new".
 */
export const featureFlagsModule: ModuleDefinition = {
  id: 'feature-flags',
  title: 'Feature Flags',
  basePath: PATHS.featureFlags,
  enabled: true,
  routes: [
    { path: PATHS.featureFlags, Component: FeatureFlagListPage },
    { path: route(PATHS.featureFlags, 'new'), Component: FeatureFlagFormPage },
    { path: route(PATHS.featureFlags, ':flagId'), Component: FeatureFlagDetailPage },
    { path: route(PATHS.featureFlags, ':flagId', 'edit'), Component: FeatureFlagFormPage },
  ],
}

export default featureFlagsModule
