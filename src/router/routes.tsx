import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router'

import { AdminLayout } from '@/layouts/admin-layout'
import { AuthLayout } from '@/layouts/auth-layout'
import { BlankLayout } from '@/layouts/blank-layout'
import { appConfig } from '@/config/app.config'
import { getModuleRoutes } from '@/modules/registry'
import { GuestRoute } from './guards/guest-route'
import { ProtectedRoute } from './guards/protected-route'
import { PATHS } from './paths'

// Shell-level screens are code-split so the initial bundle stays small.
const AuthPlaceholderPage = lazy(() => import('@/pages/auth-placeholder-page'))
const ForbiddenPage = lazy(() => import('@/pages/forbidden-page'))
const ModulePlaceholderPage = lazy(() => import('@/pages/module-placeholder-page'))
const NotFoundPage = lazy(() => import('@/pages/not-found-page'))

/**
 * The route tree.
 *
 * Three branches — auth, shell, standalone — each owning a layout. Module
 * routes are injected from the registry, so this file does not change when a
 * module is added.
 */
export const routes: RouteObject[] = [
  // ── Unauthenticated ────────────────────────────────────────────────
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: PATHS.auth.login, Component: AuthPlaceholderPage },
          { path: PATHS.auth.forgotPassword, Component: AuthPlaceholderPage },
          { path: PATHS.auth.resetPassword, Component: AuthPlaceholderPage },
        ],
      },
    ],
  },

  // ── Authenticated shell ────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to={appConfig.homePath} replace /> },

          // Routes contributed by registered modules.
          ...getModuleRoutes(),

          // Declared-but-unbuilt nav targets land here; anything else 404s.
          { path: '*', Component: ModulePlaceholderPage },
        ],
      },
    ],
  },

  // ── Standalone ─────────────────────────────────────────────────────
  {
    element: <BlankLayout />,
    children: [
      { path: PATHS.forbidden, Component: ForbiddenPage },
      { path: PATHS.notFound, Component: NotFoundPage },
    ],
  },
]
