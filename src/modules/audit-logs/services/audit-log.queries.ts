import { createResourceQueries } from '@/lib/create-resource-queries'
import type { AuditLogEntry } from '../types'

/**
 * Read-only: the API has no POST/PATCH/DELETE for audit logs, so only
 * `.useList`, `.useDetail` and `.keys` are ever used from this. The
 * create/update/remove hooks the factory returns simply go unused rather
 * than hand-rolling a separate query layer for one resource.
 */
export const auditLogs = createResourceQueries<AuditLogEntry, never, never>(
  'audit-logs',
  '/audit-logs',
)
