import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, TrendingUp, Trash2, Users } from 'lucide-react'

import { CrudTable } from '@/components/data-table'
import { ListPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { useTableState } from '@/hooks/use-table-state'
import { usePermission } from '@/hooks/use-permission'
import { PERMISSIONS } from '@/types/rbac.types'
import type { TableSchema } from '@/types/table.types'
import { formatDate, formatNumber } from '@/utils/format'
import { notify } from '@/utils/toast'
import { AnalyticsTabs } from '../components/analytics-tabs'
import { RevenueEditorModal } from '../components/revenue-editor-modal'
import { revenueAnalytics } from '../services/revenue-analytics.queries'
import type { RevenueSnapshot } from '../types'

export function RevenueListPage() {
  const canCreate = usePermission(PERMISSIONS.revenueAnalyticsCreate)
  const canUpdate = usePermission(PERMISSIONS.revenueAnalyticsUpdate)
  const canDelete = usePermission(PERMISSIONS.revenueAnalyticsDelete)

  const remove = revenueAnalytics.useRemove()

  const [total, setTotal] = useState<number | undefined>(undefined)
  const [editing, setEditing] = useState<RevenueSnapshot | null>(null)
  const [isCreating, setCreating] = useState(false)

  const schema = useMemo<TableSchema<RevenueSnapshot>>(
    () => ({
      rowKey: (row) => row.id,
      search: { placeholder: 'Search month…' },
      defaultSort: { field: 'month', direction: 'desc' },
      empty: { icon: TrendingUp, title: 'No revenue snapshots yet' },
      export: { filename: 'revenue-analytics' },
      onRowClick: canUpdate ? (row) => setEditing(row) : undefined,

      columns: [
        {
          id: 'month',
          header: 'Month',
          sortable: true,
          accessor: (row) => row.month,
          cell: (row) => <span className="font-medium">{row.month}</span>,
        },
        {
          id: 'revenue',
          header: 'Revenue',
          align: 'right',
          accessor: (row) => row.revenue,
          cell: (row) => formatNumber(row.revenue, { maximumFractionDigits: 2 }),
        },
        {
          id: 'users',
          header: 'Users',
          align: 'right',
          accessor: (row) => row.users,
        },
        {
          id: 'newUsers',
          header: 'New users',
          align: 'right',
          accessor: (row) => row.newUsers,
        },
        {
          id: 'updatedAt',
          header: 'Updated',
          accessor: (row) => row.updatedAt,
          cell: (row) => formatDate(row.updatedAt),
        },
      ],

      rowActions: [
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (row) => setEditing(row),
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          confirm: (row) => ({
            title: `Delete ${row.month}?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (row) => {
            await remove.mutateAsync(row.id)
            notify.success(`${row.month} deleted`)
          },
        },
      ],
    }),
    [canDelete, canUpdate, remove],
  )

  const table = useTableState({ schema, total })
  const list = revenueAnalytics.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []
  const totalUsers = rows.reduce((sum, row) => sum + row.users, 0)

  return (
    <>
      <ListPage
        title="Revenue Analytics"
        description="Monthly revenue and user counts."
        toolbar={<AnalyticsTabs active="revenue" />}
        actions={
          canCreate && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New snapshot
            </Button>
          )
        }
        stats={[
          { label: 'Months', value: total ?? '—', icon: TrendingUp, isLoading: list.isLoading },
          { label: 'Users (page)', value: totalUsers, icon: Users },
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

      <RevenueEditorModal
        open={isCreating || Boolean(editing)}
        entity={editing ?? undefined}
        onOpenChange={(open) => {
          if (open) return
          setCreating(false)
          setEditing(null)
        }}
      />
    </>
  )
}

export default RevenueListPage
