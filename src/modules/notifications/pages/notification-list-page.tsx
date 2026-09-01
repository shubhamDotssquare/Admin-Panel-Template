import { useEffect, useMemo, useState } from 'react'
import { Bell, BellOff, BellRing, CheckCheck, Eye, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { CrudTable } from '@/components/data-table'
import { ListPage } from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTableState } from '@/hooks/use-table-state'
import { usePermission } from '@/hooks/use-permission'
import { PERMISSIONS } from '@/types/rbac.types'
import { PATHS, route } from '@/router/paths'
import type { TableSchema } from '@/types/table.types'
import { formatDate } from '@/utils/format'
import { notify } from '@/utils/toast'
import { notifications, useMarkNotificationRead } from '../services/notification.queries'
import type { Notification } from '../types'

/** Where this module's screens live, derived from the reserved base path. */
const paths = {
  list: PATHS.notifications,
  create: route(PATHS.notifications, 'new'),
  detail: (id: string) => route(PATHS.notifications, id),
  edit: (id: string) => route(PATHS.notifications, id, 'edit'),
}

export function NotificationListPage() {
  const navigate = useNavigate()
  const remove = notifications.useRemove()
  const markRead = useMarkNotificationRead()

  const canCreate = usePermission(PERMISSIONS.notificationsCreate)
  const canUpdate = usePermission(PERMISSIONS.notificationsUpdate)
  const canDelete = usePermission(PERMISSIONS.notificationsDelete)

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<Notification>>(
    () => ({
      rowKey: (notification) => notification.id,
      search: { placeholder: 'Search title or message…' },
      defaultSort: { field: 'createdAt', direction: 'desc' },
      onRowClick: (notification) => navigate(paths.detail(notification.id)),
      empty: {
        icon: Bell,
        title: 'No notifications yet',
        description: 'Notifications sent to admins will show up here.',
      },
      export: {
        filename: 'notifications',
        fetchAll: async () => (await notifications.service.list({ limit: 500 })).items,
      },

      filters: [
        {
          id: 'read',
          label: 'Read',
          type: 'select',
          options: [
            { label: 'Read', value: 'true' },
            { label: 'Unread', value: 'false' },
          ],
        },
        { id: 'type', label: 'Type', type: 'text', placeholder: 'e.g. system' },
      ],

      columns: [
        {
          id: 'title',
          header: 'Title',
          sortable: true,
          accessor: (notification) => notification.title,
          cell: (notification) => (
            <div className="flex flex-col">
              <span className="font-medium">{notification.title}</span>
              <span className="text-caption text-muted-foreground line-clamp-1">
                {notification.message}
              </span>
            </div>
          ),
        },
        {
          id: 'type',
          header: 'Type',
          sortable: true,
          accessor: (notification) => notification.type,
          cell: (notification) => <Badge variant="outline">{notification.type}</Badge>,
        },
        {
          id: 'read',
          header: 'Read',
          accessor: (notification) => (notification.read ? 'Yes' : 'No'),
          cell: (notification) =>
            notification.read ? (
              <Badge variant="outline">Yes</Badge>
            ) : (
              // Unread gets the attention-grabbing variant — it is the state
              // that still needs someone to act on it.
              <Badge variant="default">No</Badge>
            ),
        },
        {
          id: 'recipientAdminId',
          header: 'Recipient',
          accessor: (notification) => notification.recipientAdminId ?? 'Broadcast',
          cell: (notification) =>
            notification.recipientAdminId ?? (
              <span className="text-muted-foreground">Broadcast</span>
            ),
        },
        {
          id: 'createdAt',
          header: 'Created',
          sortable: true,
          accessor: (notification) => notification.createdAt,
          cell: (notification) => formatDate(notification.createdAt),
        },
      ],

      rowActions: [
        {
          id: 'view',
          label: 'View',
          icon: Eye,
          onSelect: (notification) => navigate(paths.detail(notification.id)),
        },
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (notification) => navigate(paths.edit(notification.id)),
        },
        {
          id: 'mark-read',
          label: 'Mark as read',
          icon: CheckCheck,
          // Hidden rather than disabled: once read, marking it read again is
          // not a temporarily unavailable action, it is a meaningless one.
          hidden: (notification) => !canUpdate || notification.read,
          onSelect: async (notification) => {
            await markRead.mutateAsync(notification.id)
            notify.success(`${notification.title} marked as read`)
          },
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          confirm: (notification) => ({
            title: `Delete ${notification.title}?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (notification) => {
            await remove.mutateAsync(notification.id)
            notify.success(`${notification.title} deleted`)
          },
        },
      ],
    }),
    [canDelete, canUpdate, markRead, navigate, remove],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = notifications.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []
  const unreadCount = rows.filter((notification) => !notification.read).length

  return (
    <ListPage
      title="Notifications"
      description="Messages sent to admins, individually or as a broadcast."
      actions={
        canCreate && (
          <Button asChild size="sm">
            <Link to={paths.create}>
              <BellRing className="size-4" />
              Add notification
            </Link>
          </Button>
        )
      }
      stats={[
        {
          label: 'Total notifications',
          value: total ?? '—',
          icon: Bell,
          isLoading: list.isLoading,
        },
        { label: 'Unread (page)', value: unreadCount, icon: BellOff },
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

export default NotificationListPage
