import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const AuditLogListPage = lazy(() => import('./pages/audit-log-list-page'))
const AuditLogDetailPage = lazy(() => import('./pages/audit-log-detail-page'))

/**
 * Read-only history of actions taken across the system: list and detail
 * only — the API exposes no write endpoints for audit log entries, so there
 * is no create/edit/delete screen to mount.
 */
export const auditLogsModule: ModuleDefinition = {
  id: 'audit-logs',
  title: 'Audit Logs',
  basePath: PATHS.auditLogs,
  enabled: true,
  routes: [
    { path: PATHS.auditLogs, Component: AuditLogListPage },
    { path: route(PATHS.auditLogs, ':logId'), Component: AuditLogDetailPage },
  ],
}

export default auditLogsModule
