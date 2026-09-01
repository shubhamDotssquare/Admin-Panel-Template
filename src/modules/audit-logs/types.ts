/**
 * `AuditLogEntry` from the API.
 *
 * Immutable log rows written by the backend whenever something notable
 * happens — there is no `updatedAt` because a log entry is never edited,
 * and no Create/Update DTOs because the API exposes no write endpoints for
 * this resource (`GET /audit-logs`, `GET /audit-logs/{id}` only).
 */
export interface AuditLogEntry {
  id: string
  /** e.g. `"user.created"`. */
  action: string
  /** e.g. `"User"`. */
  entity: string
  entityId?: string | null
  metadata?: Record<string, unknown> | null
  ip?: string | null
  userAgent?: string | null
  requestId?: string | null
  adminId?: string | null
  createdAt: string
}
