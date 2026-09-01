import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const NotificationListPage = lazy(() => import('./pages/notification-list-page'))
const NotificationDetailPage = lazy(() => import('./pages/notification-detail-page'))
const NotificationFormPage = lazy(() => import('./pages/notification-form-page'))

/**
 * Admin notifications: list, detail, create, edit and mark-as-read.
 *
 * `new` is declared before `:notificationId` for readability; React Router
 * ranks static segments above dynamic ones regardless, so
 * `/notifications/new` can never be read as a notification whose id is "new".
 */
export const notificationsModule: ModuleDefinition = {
  id: 'notifications',
  title: 'Notifications',
  basePath: PATHS.notifications,
  enabled: true,
  routes: [
    { path: PATHS.notifications, Component: NotificationListPage },
    { path: route(PATHS.notifications, 'new'), Component: NotificationFormPage },
    { path: route(PATHS.notifications, ':notificationId'), Component: NotificationDetailPage },
    {
      path: route(PATHS.notifications, ':notificationId', 'edit'),
      Component: NotificationFormPage,
    },
  ],
}

export default notificationsModule
