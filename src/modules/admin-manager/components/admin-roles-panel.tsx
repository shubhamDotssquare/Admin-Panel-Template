import { KeyRound, ShieldCheck } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { Modal } from '@/components/common/modal'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { usePermission } from '@/hooks/use-permission'
import { roles as roleQueries } from '@/modules/admin-manager/services/role.queries'
import { PERMISSIONS } from '@/types/rbac.types'
import { resolveAuthError } from '@/services/auth-error'
import { cn } from '@/utils/cn'
import { notify } from '@/utils/toast'
import { useAdminRoles, useAssignRole, useRevokeRole } from '../services/admin.queries'

interface AdminRolesPanelProps {
  adminId: string
  adminName: string
  /** Render inside a `Modal` instead of inline. */
  asModal?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Assign and revoke this admin's RBAC roles.
 *
 * Each checkbox writes immediately rather than collecting a draft and saving:
 * the endpoints are per-role (`POST`/`DELETE .../roles/:roleId`) and idempotent,
 * so a batched "Save" would only be a fiction layered over several calls that
 * can each fail independently.
 *
 * Rendered both as a tab and as a modal from the row action, hence `asModal` —
 * one implementation, two entry points, per the spec's "build this into the
 * Admin screen, not a separate flow".
 */
export function AdminRolesPanel({
  adminId,
  adminName,
  asModal = false,
  open = false,
  onOpenChange,
}: AdminRolesPanelProps) {
  const canManage = usePermission(PERMISSIONS.rolesUpdate)

  const assigned = useAdminRoles(adminId)
  const available = roleQueries.useList({ limit: 100 })
  const assign = useAssignRole(adminId)
  const revoke = useRevokeRole(adminId)

  const heldIds = new Set((assigned.data?.roles ?? []).map((role) => role.roleId))
  const effective = assigned.data?.effectivePermissions ?? []
  const isBusy = assign.isPending || revoke.isPending

  const toggle = async (roleId: string, roleName: string): Promise<void> => {
    const holds = heldIds.has(roleId)

    try {
      if (holds) await revoke.mutateAsync(roleId)
      else await assign.mutateAsync(roleId)

      await assigned.refetch()
      notify.success(holds ? `Removed ${roleName}` : `Assigned ${roleName}`)
    } catch (error) {
      // PERMISSION_DENIED lands here as a plain message — not a sign-out.
      notify.error(resolveAuthError(error).message)
    }
  }

  const body = (
    <div className="flex flex-col gap-4">
      {assigned.isLoading || available.isLoading ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-12 rounded-md" />
          ))}
        </div>
      ) : (available.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No roles defined"
          description="Create a role before assigning one."
          className="border-none"
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {available.data?.items.map((role) => {
            const holds = heldIds.has(role.id)
            const inputId = `role-${adminId}-${role.id}`

            return (
              <li key={role.id}>
                <Label
                  htmlFor={inputId}
                  className={cn(
                    'flex items-start gap-2.5 rounded-md border border-transparent p-2.5 font-normal',
                    canManage ? 'cursor-pointer hover:bg-accent' : 'cursor-default',
                    holds && 'border-primary/30 bg-primary/5',
                  )}
                >
                  <Checkbox
                    id={inputId}
                    checked={holds}
                    disabled={!canManage || isBusy}
                    onCheckedChange={() => void toggle(role.id, role.name)}
                    className="mt-0.5"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {role.name}
                      {role.isSystem && <Badge variant="outline">Built-in</Badge>}
                      {!role.isActive && <Badge variant="destructive">Inactive</Badge>}
                    </span>
                    {role.description && (
                      <span className="text-caption text-muted-foreground">
                        {role.description}
                      </span>
                    )}
                  </span>
                </Label>
              </li>
            )
          })}
        </ul>
      )}

      {/* What the assignment actually adds up to, including inherited grants. */}
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <span className="flex items-center gap-1.5 text-caption font-medium">
          <KeyRound className="size-3.5" aria-hidden="true" />
          Effective permissions ({effective.length})
        </span>

        {effective.length === 0 ? (
          <span className="text-caption text-muted-foreground">
            This admin can reach nothing until a role is assigned.
          </span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {effective.map((permission) => (
              <Badge key={permission} variant="secondary" className="font-mono">
                {permission}
              </Badge>
            ))}
          </span>
        )}
      </div>

      {!canManage && (
        <p className="text-caption text-muted-foreground">
          You can see these roles but not change them.
        </p>
      )}
    </div>
  )

  if (!asModal) {
    return (
      <Card>
        <CardContent>{body}</CardContent>
      </Card>
    )
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange ?? (() => undefined)}
      title="Manage roles"
      description={`Roles decide what ${adminName} can reach.`}
      size="lg"
    >
      {body}
    </Modal>
  )
}
