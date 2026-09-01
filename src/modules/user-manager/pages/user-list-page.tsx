import { useEffect, useMemo, useState } from 'react'
import { Ban, CheckCircle2, Eye, Pencil, Trash2, UserPlus, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { CrudTable } from '@/components/data-table'
import { ListPage, StatusBadge } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { useTableState } from '@/hooks/use-table-state'
import { usePermission } from '@/hooks/use-permission'
import { PERMISSIONS } from '@/types/rbac.types'
import { PATHS, route } from '@/router/paths'
import type { TableSchema } from '@/types/table.types'
import { formatDate, formatRelativeTime } from '@/utils/format'
import { notify } from '@/utils/toast'
import { users, useUserLifecycle } from '../services/user.queries'
import { USER_STATUS, USER_STATUS_OPTIONS, userFullName, type User } from '../types'

/** Where this module's screens live, derived from the reserved base path. */
const paths = {
  list: PATHS.userManager,
  create: route(PATHS.userManager, 'new'),
  detail: (id: string) => route(PATHS.userManager, id),
  edit: (id: string) => route(PATHS.userManager, id, 'edit'),
}

export function UserListPage() {
  const navigate = useNavigate()
  const remove = users.useRemove()

  const canCreate = usePermission(PERMISSIONS.usersCreate)
  const canUpdate = usePermission(PERMISSIONS.usersUpdate)
  const canDelete = usePermission(PERMISSIONS.usersDelete)
  const lifecycle = useUserLifecycle()

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<User>>(
    () => ({
      rowKey: (user) => user.id,
      search: { placeholder: 'Search name or email…' },
      defaultSort: { field: 'lastName', direction: 'asc' },
      onRowClick: (user) => navigate(paths.detail(user.id)),
      empty: {
        icon: Users,
        title: 'No users yet',
        description: 'Add the first user to get started.',
      },
      export: {
        filename: 'users',
        fetchAll: async () => (await users.service.list({ limit: 500 })).items,
      },

      filters: [
        { id: 'status', label: 'Status', type: 'select', options: USER_STATUS_OPTIONS },
      ],

      columns: [
        {
          id: 'name',
          header: 'Name',
          sortable: true,
          sortKey: 'lastName',
          accessor: (user) => userFullName(user),
          cell: (user) => (
            <div className="flex flex-col">
              <span className="font-medium">{userFullName(user)}</span>
              <span className="text-caption text-muted-foreground">{user.email}</span>
            </div>
          ),
        },
        {
          id: 'status',
          header: 'Status',
          accessor: (user) => USER_STATUS[user.status]?.label ?? user.status,
          cell: (user) => <StatusBadge status={user.status} map={USER_STATUS} />,
        },
        {
          id: 'phone',
          header: 'Phone',
          accessor: (user) => user.phone ?? '',
          cell: (user) => user.phone ?? <span className="text-muted-foreground">—</span>,
        },
        {
          id: 'lastLoginAt',
          header: 'Last seen',
          sortable: true,
          accessor: (user) => user.lastLoginAt ?? '',
          cell: (user) =>
            user.lastLoginAt ? (
              formatRelativeTime(user.lastLoginAt)
            ) : (
              <span className="text-muted-foreground">Never</span>
            ),
        },
        {
          id: 'createdAt',
          header: 'Created',
          sortable: true,
          defaultHidden: true,
          accessor: (user) => user.createdAt ?? '',
          cell: (user) => (user.createdAt ? formatDate(user.createdAt) : '—'),
        },
      ],

      rowActions: [
        {
          id: 'view',
          label: 'View',
          icon: Eye,
          onSelect: (user) => navigate(paths.detail(user.id)),
        },
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (user) => navigate(paths.edit(user.id)),
        },
        {
          id: 'suspend',
          label: 'Suspend',
          icon: Ban,
          // Hidden rather than disabled: "suspend" on a suspended account is
          // not a temporarily unavailable action, it is a meaningless one.
          hidden: (user) => !canUpdate || user.status === 'SUSPENDED',
          confirm: (user) => ({
            title: `Suspend ${userFullName(user)}?`,
            description: 'They will be signed out and blocked from signing in again.',
            confirmLabel: 'Suspend',
            destructive: true,
          }),
          onSelect: async (user) => {
            await lifecycle.mutateAsync({ id: user.id, action: 'suspend' })
            notify.success(`${userFullName(user)} suspended`)
          },
        },
        {
          id: 'activate',
          label: 'Activate',
          icon: CheckCircle2,
          hidden: (user) => !canUpdate || user.status === 'ACTIVE',
          onSelect: async (user) => {
            await lifecycle.mutateAsync({ id: user.id, action: 'activate' })
            notify.success(`${userFullName(user)} activated`)
          },
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          confirm: (user) => ({
            title: `Delete ${userFullName(user)}?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (user) => {
            await remove.mutateAsync(user.id)
            notify.success(`${userFullName(user)} deleted`)
          },
        },
      ],

      bulkActions: [
        {
          id: 'bulk-activate',
          label: 'Activate',
          icon: CheckCircle2,
          onSelect: async (rows) => {
            await Promise.all(
              rows.map((user) => lifecycle.mutateAsync({ id: user.id, action: 'activate' })),
            )
            notify.success(`Activated ${rows.length}`)
          },
        },
        {
          id: 'bulk-suspend',
          label: 'Suspend',
          icon: Ban,
          destructive: true,
          confirm: (rows) => ({
            title: `Suspend ${rows.length} ${rows.length === 1 ? 'user' : 'users'}?`,
            confirmLabel: 'Suspend',
            destructive: true,
          }),
          onSelect: async (rows) => {
            await Promise.all(
              rows.map((user) => lifecycle.mutateAsync({ id: user.id, action: 'suspend' })),
            )
            notify.success(`Suspended ${rows.length}`)
          },
        },
      ],
    }),
    [canDelete, canUpdate, lifecycle, navigate, remove],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = users.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []
  const countBy = (status: User['status']): number =>
    rows.filter((user) => user.status === status).length

  return (
    <ListPage
      title="Users"
      description="Accounts that can sign in to the customer-facing product."
      actions={
        canCreate && (
          <Button asChild size="sm">
            <Link to={paths.create}>
              <UserPlus className="size-4" />
              Add user
            </Link>
          </Button>
        )
      }
      stats={[
        { label: 'Total users', value: total ?? '—', icon: Users, isLoading: list.isLoading },
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

export default UserListPage
