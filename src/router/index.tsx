import { createBrowserRouter } from 'react-router'

import { routes } from './routes'

/** The app's single router instance. */
export const router = createBrowserRouter(routes)

export { PATHS, route } from './paths'
export { routes } from './routes'
export { GuestRoute, PermissionRoute, ProtectedRoute } from './guards'
