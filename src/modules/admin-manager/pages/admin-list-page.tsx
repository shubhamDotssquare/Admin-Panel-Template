import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  Eye,
  Pencil,
  Power,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { CrudTable } from '@/components/data-table'
import { ListPage, StatusBadge } from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useTableState } from '@/hooks/use-table-state'
import { usePermission } from '@/hooks/use-permission'
import { PATHS, route } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import type { TableSchema } from '@/types/table.types'
import { formatRelativeTime } from '@/utils/format'
import { notify } from '@/utils/toast'
import { admins, useAdminLifecycle } from '../services/admin.queries'
import {
  ADMIN_ROLE_LABELS,
  ADMIN_STATUS,
  ADMIN_STATUS_OPTIONS,
  ADMIN_ROLE_OPTIONS,
  adminFullName,
  type Admin,
} from '../types'

const paths = {
  create: route(PATHS.adminManager, 'new'),
  detail: (id: string) => route(PATHS.adminManager, id),
  edit: (id: string) => route(PATHS.adminManager, id, 'edit'),
  roles: route(PATHS.adminManager, 'roles'),
}

export function AdminListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const lifecycle = useAdminLifecycle()
  const remove = admins.useRemove()

  const canCreate = usePermission(PERMISSIONS.adminsCreate)
  const canUpdate = usePermission(PERMISSIONS.adminsUpdate)
  const canDelete = usePermission(PERMISSIONS.adminsDelete)
  const canReadRoles = usePermission(PERMISSIONS.rolesRead)

  const [total, setTotal] = useState<number | undefined>(undefined)

  /**
   * The API rejects deactivate, suspend and delete on your own account with a
   * 400 self-lockout guard. Disabling those rows here is not belt-and-braces —
   * an action that can only ever fail should not be offered.
   */
  const isSelf = useCallback(
    (admin: Admin): boolean => Boolean(user?.id) && admin.id === user?.id,
    [user?.id],
  )

  const schema = useMemo<TableSchema<Admin>>(
    () => ({
      rowKey: (admin) => admin.id,
      search: { placeholder: 'Search email, name or username…' },
      defaultSort: { field: 'createdAt', direction: 'desc' },
      onRowClick: (admin) => navigate(paths.detail(admin.id)),
      empty: { icon: ShieldCheck, title: 'No administrators found' },
      export: {
        filename: 'administrators',
        fetchAll: async () => (await admins.service.list({ limit: 500 })).items,
      },

      filters: [
        { id: 'status', label: 'Status', type: 'select', options: ADMIN_STATUS_OPTIONS },
        { id: 'role', label: 'Role', type: 'select', options: ADMIN_ROLE_OPTIONS },
      ],

      columns: [
        {
          id: 'name',
          header: 'Name',
          sortable: true,
          sortKey: 'firstName',
          accessor: (admin) => adminFullName(admin),
          cell: (admin) => (
            <div className="flex flex-col">
              <span className="flex items-center gap-2 font-medium">
                {adminFullName(admin)}
                {isSelf(admin) && <Badge variant="outline">You</Badge>}
              </span>
              <span className="text-caption text-muted-foreground">{admin.email}</span>
            </div>
          ),
        },
        {
          id: 'role',
          header: 'Role',
          sortable: true,
          accessor: (admin) => ADMIN_ROLE_LABELS[admin.role] ?? admin.role,
          cell: (admin) => (
            <Badge variant="secondary">{ADMIN_ROLE_LABELS[admin.role] ?? admin.role}</Badge>
          ),
        },
        {
          id: 'status',
          header: 'Status',
          accessor: (admin) => ADMIN_STATUS[admin.status]?.label ?? admin.status,
          cell: (admin) => <StatusBadge status={admin.status} map={ADMIN_STATUS} />,
        },
        {
          id: 'username',
          header: 'Username',
          defaultHidden: true,
          accessor: (admin) => admin.username ?? '',
        },
        {
          id: 'lastLoginAt',
          header: 'Last seen',
          sortable: true,
          accessor: (admin) => admin.lastLoginAt ?? '',
          cell: (admin) =>
            admin.lastLoginAt ? (
              formatRelativeTime(admin.lastLoginAt)
            ) : (
              <span className="text-muted-foreground">Never</span>
            ),
        },
      ],

      rowActions: [
        {
          id: 'view',
          label: 'View',
          icon: Eye,
          onSelect: (admin) => navigate(paths.detail(admin.id)),
        },
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (admin) => navigate(paths.edit(admin.id)),
        },
        {
          id: 'activate',
          label: 'Activate',
          icon: CheckCircle2,
          hidden: (admin) => !canUpdate || admin.status === 'ACTIVE',
          onSelect: async (admin) => {
            await lifecycle.mutateAsync({ id: admin.id, action: 'activate' })
            notify.success(`${adminFullName(admin)} activated`)
          },
        },
        {
          id: 'deactivate',
          label: 'Deactivate',
          icon: Power,
          hidden: (admin) => !canUpdate || admin.status === 'INACTIVE',
          // Self-lockout: shown but inert, so the reason is visible.
          disabled: isSelf,
          confirm: (admin) => ({
            title: `Deactivate ${adminFullName(admin)}?`,
            description: 'Their active sessions end immediately.',
            confirmLabel: 'Deactivate',
            destructive: true,
          }),
          onSelect: async (admin) => {
            await lifecycle.mutateAsync({ id: admin.id, action: 'deactivate' })
            notify.success(`${adminFullName(admin)} deactivated`)
          },
        },
        {
          id: 'suspend',
          label: 'Suspend',
          icon: Ban,
          hidden: (admin) => !canUpdate || admin.status === 'SUSPENDED',
          disabled: isSelf,
          confirm: (admin) => ({
            title: `Suspend ${adminFullName(admin)}?`,
            description: 'Their active sessions end immediately.',
            confirmLabel: 'Suspend',
            destructive: true,
          }),
          onSelect: async (admin) => {
            await lifecycle.mutateAsync({ id: admin.id, action: 'suspend' })
            notify.success(`${adminFullName(admin)} suspended`)
          },
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          disabled: isSelf,
          confirm: (admin) => ({
            title: `Delete ${adminFullName(admin)}?`,
            description: 'The account is archived and loses access immediately.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (admin) => {
            await remove.mutateAsync(admin.id)
            notify.success(`${adminFullName(admin)} deleted`)
          },
        },
      ],
    }),
    [canDelete, canUpdate, isSelf, lifecycle, navigate, remove],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = admins.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []
  const countBy = (status: Admin['status']): number =>
    rows.filter((admin) => admin.status === status).length

  return (
    <ListPage
      title="Administrators"
      description="Accounts with access to this panel."
      actions={
        <div className="flex items-center gap-2">
          {canReadRoles && (
            <Button asChild variant="outline" size="sm">
              <Link to={paths.roles}>
                <ShieldCheck className="size-4" />
                Roles
              </Link>
            </Button>
          )}
          {canCreate && (
            <Button asChild size="sm">
              <Link to={paths.create}>
                <UserPlus className="size-4" />
                Add admin
              </Link>
            </Button>
          )}
        </div>
      }
      stats={[
        {
          label: 'Administrators',
          value: total ?? '—',
          icon: ShieldCheck,
          isLoading: list.isLoading,
        },
        { label: 'Active (page)', value: countBy('ACTIVE'), icon: CheckCircle2 },
        { label: 'Pending (page)', value: countBy('PENDING') },
        { label: 'Suspended (page)', value: countBy('SUSPENDED'), icon: Ban },
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
  )
}

export default AdminListPage
