import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router'

import { AdminShell } from '@/layouts/admin-shell'
import { AuthLayout } from '@/layouts/auth-layout'
import { BlankLayout } from '@/layouts/blank-layout'
import { appConfig } from '@/config/app.config'
import { getModuleRoutes } from '@/modules/registry'
import { GuestRoute } from './guards/guest-route'
import { ProtectedRoute } from './guards/protected-route'
import { PATHS, route } from './paths'

// Shell-level screens are code-split so the initial bundle stays small.
const ForbiddenPage = lazy(() => import('@/pages/forbidden-page'))
const ModulePlaceholderPage = lazy(() => import('@/pages/module-placeholder-page'))
const NotFoundPage = lazy(() => import('@/pages/not-found-page'))
const ProfilePage = lazy(() => import('@/pages/profile-page'))

// Authentication screens.
const LoginPage = lazy(() => import('@/pages/auth/login-page'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password-page'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password-page'))
const RegisterPage = lazy(() => import('@/pages/auth/register-page'))
const VerifyEmailPage = lazy(() => import('@/pages/auth/verify-email-page'))

// Account settings screens.
const GeneralSettingsPage = lazy(() => import('@/pages/settings/general-page'))
const ChangePasswordPage = lazy(() => import('@/pages/settings/change-password-page'))
const SessionsPage = lazy(() => import('@/pages/settings/sessions-page'))

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
          { path: PATHS.auth.login, Component: LoginPage },
          { path: PATHS.auth.forgotPassword, Component: ForgotPasswordPage },
          { path: PATHS.auth.resetPassword, Component: ResetPasswordPage },
          { path: PATHS.auth.register, Component: RegisterPage },
          { path: PATHS.auth.verifyEmail, Component: VerifyEmailPage },
        ],
      },
    ],
  },

  // ── Authenticated shell ────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminShell />,
        children: [
          { index: true, element: <Navigate to={appConfig.homePath} replace /> },

          // Account screens reached from the header's user menu.
          { path: PATHS.profile, Component: ProfilePage },
          { path: PATHS.settings, Component: GeneralSettingsPage },
          { path: route(PATHS.settings, 'security'), Component: ChangePasswordPage },
          { path: route(PATHS.settings, 'devices'), Component: SessionsPage },

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
