import type { RouteObject } from 'react-router'

import type { ModuleDefinition } from '@/types/module.types'
import type { NavGroup } from '@/types/navigation.types'
import { dashboardModule } from './dashboard'

/**
 * The one place modules are plugged into the app.
 *
 * Register a module here and the router mounts its routes and the sidebar picks
 * up any navigation it contributes. Nothing else in the framework imports a
 * module directly — that boundary is what keeps the shell reusable.
 *
 * Planned: admin-manager, user-manager, cms, settings, enquiry-manager,
 * email-templates, help-support, analytics. Their paths are already reserved in
 * `@/router/paths` and listed in `@/config/navigation.config`, so each can be
 * dropped in independently.
 */
export const MODULE_REGISTRY: ModuleDefinition[] = [dashboardModule]

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
