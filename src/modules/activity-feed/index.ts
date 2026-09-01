import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const ActivityFeedListPage = lazy(() => import('./pages/activity-feed-list-page'))
const ActivityFeedDetailPage = lazy(() => import('./pages/activity-feed-detail-page'))
const ActivityFeedFormPage = lazy(() => import('./pages/activity-feed-form-page'))

/**
 * Human-readable events surfaced to end users: list, detail, create and
 * edit.
 *
 * `new` is declared before `:itemId` for readability; React Router ranks
 * static segments above dynamic ones regardless, so `/activity-feed/new`
 * can never be read as an entry whose id is "new".
 */
export const activityFeedModule: ModuleDefinition = {
  id: 'activity-feed',
  title: 'Activity Feed',
  basePath: PATHS.activityFeed,
  enabled: true,
  routes: [
    { path: PATHS.activityFeed, Component: ActivityFeedListPage },
    { path: route(PATHS.activityFeed, 'new'), Component: ActivityFeedFormPage },
    { path: route(PATHS.activityFeed, ':itemId'), Component: ActivityFeedDetailPage },
    { path: route(PATHS.activityFeed, ':itemId', 'edit'), Component: ActivityFeedFormPage },
  ],
}

export default activityFeedModule
