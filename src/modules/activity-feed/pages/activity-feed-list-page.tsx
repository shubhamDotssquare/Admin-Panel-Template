import { useEffect, useMemo, useState } from 'react'
import { Activity, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { CrudTable } from '@/components/data-table'
import { ListPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { useTableState } from '@/hooks/use-table-state'
import { usePermission } from '@/hooks/use-permission'
import { PERMISSIONS } from '@/types/rbac.types'
import { PATHS, route } from '@/router/paths'
import type { TableSchema } from '@/types/table.types'
import { formatDateTime } from '@/utils/format'
import { truncate } from '@/utils/string'
import { notify } from '@/utils/toast'
import { activityFeed } from '../services/activity-feed.queries'
import type { ActivityFeedItem } from '../types'

/** Where this module's screens live, derived from the reserved base path. */
const paths = {
  list: PATHS.activityFeed,
  create: route(PATHS.activityFeed, 'new'),
  detail: (id: string) => route(PATHS.activityFeed, id),
  edit: (id: string) => route(PATHS.activityFeed, id, 'edit'),
}

export function ActivityFeedListPage() {
  const navigate = useNavigate()
  const remove = activityFeed.useRemove()

  const canCreate = usePermission(PERMISSIONS.activityFeedCreate)
  const canUpdate = usePermission(PERMISSIONS.activityFeedUpdate)
  const canDelete = usePermission(PERMISSIONS.activityFeedDelete)

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<ActivityFeedItem>>(
    () => ({
      rowKey: (item) => item.id,
      search: { placeholder: 'Search activity…' },
      defaultSort: { field: 'createdAt', direction: 'desc' },
      onRowClick: (item) => navigate(paths.detail(item.id)),
      empty: {
        icon: Activity,
        title: 'No activity yet',
        description: 'Entries will appear here as things happen.',
      },
      export: {
        filename: 'activity-feed',
        fetchAll: async () => (await activityFeed.service.list({ limit: 500 })).items,
      },

      filters: [{ id: 'type', label: 'Type', type: 'text', placeholder: 'e.g. user_registered' }],

      columns: [
        {
          id: 'type',
          header: 'Type',
          accessor: (item) => item.type,
          cell: (item) => <code className="font-mono text-caption">{item.type}</code>,
        },
        {
          id: 'message',
          header: 'Message',
          accessor: (item) => item.message,
          cell: (item) => <span>{truncate(item.message, 80)}</span>,
        },
        {
          id: 'createdAt',
          header: 'Created',
          sortable: true,
          accessor: (item) => item.createdAt,
          cell: (item) => formatDateTime(item.createdAt),
        },
      ],

      rowActions: [
        {
          id: 'view',
          label: 'View',
          icon: Eye,
          onSelect: (item) => navigate(paths.detail(item.id)),
        },
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (item) => navigate(paths.edit(item.id)),
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          confirm: () => ({
            title: 'Delete this entry?',
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (item) => {
            await remove.mutateAsync(item.id)
            notify.success('Entry deleted')
          },
        },
      ],
    }),
    [canDelete, canUpdate, navigate, remove],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = activityFeed.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []

  return (
    <ListPage
      title="Activity feed"
      description="Human-readable events surfaced to end users."
      actions={
        canCreate && (
          <Button asChild size="sm">
            <Link to={paths.create}>
              <Plus className="size-4" />
              New entry
            </Link>
          </Button>
        )
      }
      stats={[{ label: 'Total entries', value: total ?? '—', icon: Activity, isLoading: list.isLoading }]}
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

export default ActivityFeedListPage
