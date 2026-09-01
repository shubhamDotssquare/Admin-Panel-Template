import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, KeyRound, Pencil, Plus, Power, ShieldCheck, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import { CrudTable } from '@/components/data-table'
import { ListPage } from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTableState } from '@/hooks/use-table-state'
import { usePermission } from '@/hooks/use-permission'
import { PATHS } from '@/router/paths'
import { resolveAuthError } from '@/services/auth-error'
import { PERMISSIONS, type RoleSummary } from '@/types/rbac.types'
import type { TableSchema } from '@/types/table.types'
import { notify } from '@/utils/toast'
import { RoleEditorModal } from '../components/role-editor-modal'
import { roles } from '../services/role.queries'

export function RoleListPage() {
  const canCreate = usePermission(PERMISSIONS.rolesCreate)
  const canUpdate = usePermission(PERMISSIONS.rolesUpdate)
  const canDelete = usePermission(PERMISSIONS.rolesDelete)

  const update = roles.useUpdate()
  const remove = roles.useRemove()

  const [total, setTotal] = useState<number | undefined>(undefined)
  const [editing, setEditing] = useState<RoleSummary | null>(null)
  const [isCreating, setCreating] = useState(false)

  const schema = useMemo<TableSchema<RoleSummary>>(
    () => ({
      rowKey: (role) => role.id,
      search: { placeholder: 'Search roles…' },
      defaultSort: { field: 'level', direction: 'asc' },
      empty: { icon: ShieldCheck, title: 'No roles defined' },
      export: { filename: 'roles' },
      onRowClick: canUpdate ? (role) => setEditing(role) : undefined,

      filters: [
        {
          id: 'isActive',
          label: 'State',
          type: 'select',
          options: [
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ],
        },
      ],

      columns: [
        {
          id: 'name',
          header: 'Role',
          sortable: true,
          accessor: (role) => role.name,
          cell: (role) => (
            <div className="flex flex-col">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {role.name}
                {role.isSystem && <Badge variant="outline">Built-in</Badge>}
                {!role.isActive && <Badge variant="destructive">Inactive</Badge>}
              </span>
              {role.description && (
                <span className="text-caption text-muted-foreground">{role.description}</span>
              )}
            </div>
          ),
        },
        {
          id: 'key',
          header: 'Key',
          sortable: true,
          accessor: (role) => role.key,
          cell: (role) => <span className="font-mono text-caption">{role.key}</span>,
        },
        {
          id: 'parentName',
          header: 'Inherits from',
          accessor: (role) => role.parentName ?? '',
          cell: (role) => role.parentName ?? <span className="text-muted-foreground">—</span>,
        },
        {
          id: 'level',
          header: 'Level',
          align: 'right',
          width: '6rem',
          sortable: true,
          accessor: (role) => role.level ?? 0,
        },
      ],

      rowActions: [
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (role) => setEditing(role),
        },
        {
          id: 'toggle',
          label: (role) => (role.isActive ? 'Deactivate' : 'Activate'),
          icon: Power,
          hidden: () => !canUpdate,
          confirm: (role) =>
            role.isActive
              ? {
                  title: `Deactivate ${role.name}?`,
                  description:
                    'Everything this role grants is revoked immediately from every admin holding it.',
                  confirmLabel: 'Deactivate',
                  destructive: true,
                }
              : { title: `Activate ${role.name}?`, confirmLabel: 'Activate' },
          onSelect: async (role) => {
            await update.mutateAsync({ id: role.id, payload: { isActive: !role.isActive } })
            notify.success(
              role.isActive ? `${role.name} deactivated` : `${role.name} activated`,
            )
          },
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          // Seeded roles are protected server-side (403 SYSTEM_ROLE_PROTECTED).
          // Showing it disabled explains *why* deletion is unavailable, where
          // hiding it would just look like a missing feature.
          disabled: (role) => role.isSystem,
          confirm: (role) => ({
            title: `Delete ${role.name}?`,
            description: 'Admins holding it lose whatever it granted.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (role) => {
            try {
              await remove.mutateAsync(role.id)
              notify.success(`${role.name} deleted`)
            } catch (error) {
              // Belt and braces: a role could become protected server-side
              // between render and click.
              notify.error(resolveAuthError(error).message)
            }
          },
        },
      ],
    }),
    [canDelete, canUpdate, remove, update],
  )

  const table = useTableState({ schema, total })
  const list = roles.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []

  return (
    <>
      <ListPage
        title="Roles"
        description="What each role grants, and which roles inherit from which."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={PATHS.adminManager}>
                <ArrowLeft className="size-4" />
                Administrators
              </Link>
            </Button>
            {canCreate && (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                New role
              </Button>
            )}
          </div>
        }
        stats={[
          { label: 'Roles', value: total ?? '—', icon: ShieldCheck, isLoading: list.isLoading },
          {
            label: 'Active (page)',
            value: rows.filter((r) => r.isActive).length,
            icon: KeyRound,
          },
          { label: 'Built-in (page)', value: rows.filter((r) => r.isSystem).length },
        ]}
      >
        <CrudTable
          schema={schema}
          table={table}
          rows={rows}
          total={total}
          isLoading={list.isLoading}
          error={list.error}
        />
      </ListPage>

      <RoleEditorModal
        open={isCreating || Boolean(editing)}
        role={editing ?? undefined}
        allRoles={rows}
        onOpenChange={(open) => {
          if (open) return
          setCreating(false)
          setEditing(null)
        }}
      />
    </>
  )
}

export default RoleListPage
