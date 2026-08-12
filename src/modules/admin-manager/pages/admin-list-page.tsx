import { useEffect, useMemo, useState } from 'react'
import { Ban, CheckCircle2, Eye, Pencil, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { CrudTable } from '@/components/data-table'
import { ListPage, StatusBadge } from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTableState } from '@/hooks/use-table-state'
import { PATHS, route } from '@/router/paths'
import type { TableSchema } from '@/types/table.types'
import { formatRelativeTime } from '@/utils/format'
import { notify } from '@/utils/toast'
import { admins, useRoleOptions, useSetAdminStatus } from '../services/admin.queries'
import { ADMIN_STATUS, ADMIN_STATUS_OPTIONS, adminFullName, type Admin } from '../types'

const paths = {
  list: PATHS.adminManager,
  create: route(PATHS.adminManager, 'new'),
  detail: (id: string) => route(PATHS.adminManager, id),
  edit: (id: string) => route(PATHS.adminManager, id, 'edit'),
  roles: route(PATHS.adminManager, 'roles'),
}

export function AdminListPage() {
  const navigate = useNavigate()
  const remove = admins.useRemove()
  const setStatus = useSetAdminStatus()
  const { options: roleOptions } = useRoleOptions()

  const [total, setTotal] = useState<number | undefined>(undefined)

  /** Role ids are opaque; the list needs their names. */
  const roleName = useMemo(() => {
    const map = new Map(roleOptions.map((option) => [String(option.value), option.label]))
    return (id: string) => map.get(id) ?? id
  }, [roleOptions])

  const schema = useMemo<TableSchema<Admin>>(
    () => ({
      rowKey: (admin) => admin.id,
      search: { placeholder: 'Search name or email…' },
      defaultSort: { field: 'lastName', direction: 'asc' },
      onRowClick: (admin) => navigate(paths.detail(admin.id)),
      empty: {
        icon: ShieldCheck,
        title: 'No administrators',
        description: 'Invite someone to help run the panel.',
      },
      export: {
        filename: 'administrators',
        fetchAll: async () => (await admins.service.list({ perPage: 500 })).items,
      },

      filters: [
        { id: 'status', label: 'Status', type: 'select', options: ADMIN_STATUS_OPTIONS },
        // `roles`, not `role`: the filter id is the API field it queries, and
        // an administrator holds an array of them.
        ...(roleOptions.length
          ? ([{ id: 'roles', label: 'Role', type: 'select', options: roleOptions }] as const)
          : []),
      ],

      columns: [
        {
          id: 'name',
          header: 'Name',
          sortable: true,
          sortKey: 'lastName',
          accessor: (admin) => adminFullName(admin),
          cell: (admin) => (
            <div className="flex flex-col">
              <span className="font-medium">{adminFullName(admin)}</span>
              <span className="text-caption text-muted-foreground">{admin.email}</span>
            </div>
          ),
        },
        {
          id: 'roles',
          header: 'Roles',
          accessor: (admin) => admin.roles.map(roleName).join(', '),
          wrap: true,
          cell: (admin) =>
            admin.roles.length ? (
              <span className="flex flex-wrap gap-1">
                {admin.roles.map((id) => (
                  <Badge key={id} variant="secondary">
                    {roleName(id)}
                  </Badge>
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">None</span>
            ),
        },
        {
          id: 'status',
          header: 'Status',
          accessor: (admin) => ADMIN_STATUS[admin.status]?.label ?? admin.status,
          cell: (admin) => <StatusBadge status={admin.status} map={ADMIN_STATUS} />,
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
          onSelect: (admin) => navigate(paths.edit(admin.id)),
        },
        {
          id: 'suspend',
          label: 'Suspend',
          icon: Ban,
          hidden: (admin) => admin.status === 'SUSPENDED',
          confirm: (admin) => ({
            title: `Suspend ${adminFullName(admin)}?`,
            description: 'They lose access to the panel immediately.',
            confirmLabel: 'Suspend',
            destructive: true,
          }),
          onSelect: async (admin) => {
            await setStatus.mutateAsync({ id: admin.id, status: 'SUSPENDED' })
            notify.success(`${adminFullName(admin)} suspended`)
          },
        },
        {
          id: 'activate',
          label: 'Activate',
          icon: CheckCircle2,
          hidden: (admin) => admin.status === 'ACTIVE',
          onSelect: async (admin) => {
            await setStatus.mutateAsync({ id: admin.id, status: 'ACTIVE' })
            notify.success(`${adminFullName(admin)} activated`)
          },
        },
        {
          id: 'delete',
          label: 'Remove',
          icon: Trash2,
          destructive: true,
          confirm: (admin) => ({
            title: `Remove ${adminFullName(admin)}?`,
            description: 'They lose access immediately. This cannot be undone.',
            confirmLabel: 'Remove',
          }),
          onSelect: async (admin) => {
            await remove.mutateAsync(admin.id)
            notify.success(`${adminFullName(admin)} removed`)
          },
        },
      ],

      bulkActions: [
        {
          id: 'bulk-suspend',
          label: 'Suspend',
          icon: Ban,
          destructive: true,
          confirm: (rows) => ({
            title: `Suspend ${rows.length} ${rows.length === 1 ? 'administrator' : 'administrators'}?`,
            confirmLabel: 'Suspend',
            destructive: true,
          }),
          onSelect: async (rows) => {
            await Promise.all(
              rows.map((admin) => setStatus.mutateAsync({ id: admin.id, status: 'SUSPENDED' })),
            )
            notify.success(`Suspended ${rows.length}`)
          },
        },
      ],
    }),
    [navigate, remove, roleName, roleOptions, setStatus],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = admins.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.meta.total)
  }, [list.data?.meta.total])

  const rows = list.data?.items ?? []

  return (
    <ListPage
      title="Administrators"
      description="Staff accounts with access to this panel."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={paths.roles}>
              <ShieldCheck className="size-4" />
              Manage roles
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to={paths.create}>
              <UserPlus className="size-4" />
              Invite administrator
            </Link>
          </Button>
        </div>
      }
      stats={[
        {
          label: 'Administrators',
          value: total ?? '—',
          icon: ShieldCheck,
          isLoading: list.isLoading,
        },
        {
          label: 'Active (page)',
          value: rows.filter((a) => a.status === 'ACTIVE').length,
          icon: CheckCircle2,
        },
        { label: 'Invited (page)', value: rows.filter((a) => a.status === 'INVITED').length },
        { label: 'Roles defined', value: roleOptions.length },
      ]}
    >
      <CrudTable
        schema={schema}
        table={table}
        rows={rows}
        total={total}
        isLoading={list.isLoading}
      />
    </ListPage>
  )
}

export default AdminListPage
