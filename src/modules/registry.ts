import type { RouteObject } from 'react-router'

import type { ModuleDefinition } from '@/types/module.types'
import type { NavGroup } from '@/types/navigation.types'
import { activityFeedModule } from './activity-feed'
import { adminManagerModule } from './admin-manager'
import { analyticsModule } from './analytics'
import { auditLogsModule } from './audit-logs'
import { cmsModule } from './cms'
import { dashboardModule } from './dashboard'
import { emailTemplatesModule } from './email-templates'
import { enquiryManagerModule } from './enquiry-manager'
import { featureFlagsModule } from './feature-flags'
import { helpSupportModule } from './help-support'
import { notesModule } from './notes'
import { notificationsModule } from './notifications'
import { userManagerModule } from './user-manager'

/**
 * The one place modules are plugged into the app.
 *
 * Register a module here and the router mounts its routes and the sidebar picks
 * up any navigation it contributes. Nothing else in the framework imports a
 * module directly — that boundary is what keeps the shell reusable.
 */
export const MODULE_REGISTRY: ModuleDefinition[] = [
  dashboardModule,
  userManagerModule,
  adminManagerModule,
  enquiryManagerModule,
  emailTemplatesModule,
  cmsModule,
  helpSupportModule,
  analyticsModule,
  notificationsModule,
  notesModule,
  featureFlagsModule,
  auditLogsModule,
  activityFeedModule,
]

/** Registered modules that are switched on. */
export function getEnabledModules(
  registry: ModuleDefinition[] = MODULE_REGISTRY,
): ModuleDefinition[] {
  return registry.filter((module) => module.enabled !== false)
}

/** Flatten every enabled module's routes for mounting inside the shell. */
export function getModuleRoutes(registry: ModuleDefinition[] = MODULE_REGISTRY): RouteObject[] {
  return getEnabledModules(registry).flatMap((module) => module.routes)
}

/** Collect navigation contributed by modules, appended after the static config. */
export function getModuleNavigation(
  registry: ModuleDefinition[] = MODULE_REGISTRY,
): NavGroup[] {
  return getEnabledModules(registry).flatMap((module) => module.navigation ?? [])
}

/** True when some module already owns this pathname. */
export function isPathRegistered(
  pathname: string,
  registry: ModuleDefinition[] = MODULE_REGISTRY,
): boolean {
  return getEnabledModules(registry).some(
    (module) => pathname === module.basePath || pathname.startsWith(`${module.basePath}/`),
  )
}
