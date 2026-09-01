import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Smartphone, Trash2 } from 'lucide-react'

import { CrudTable } from '@/components/data-table'
import { ListPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { useTableState } from '@/hooks/use-table-state'
import { usePermission } from '@/hooks/use-permission'
import { PERMISSIONS } from '@/types/rbac.types'
import type { TableSchema } from '@/types/table.types'
import { formatDate } from '@/utils/format'
import { notify } from '@/utils/toast'
import { AnalyticsTabs } from '../components/analytics-tabs'
import { DeviceEditorModal } from '../components/device-editor-modal'
import { deviceAnalytics } from '../services/device-analytics.queries'
import type { DeviceAnalytic } from '../types'

export function DeviceListPage() {
  const canCreate = usePermission(PERMISSIONS.deviceAnalyticsCreate)
  const canUpdate = usePermission(PERMISSIONS.deviceAnalyticsUpdate)
  const canDelete = usePermission(PERMISSIONS.deviceAnalyticsDelete)

  const remove = deviceAnalytics.useRemove()

  const [total, setTotal] = useState<number | undefined>(undefined)
  const [editing, setEditing] = useState<DeviceAnalytic | null>(null)
  const [isCreating, setCreating] = useState(false)

  const schema = useMemo<TableSchema<DeviceAnalytic>>(
    () => ({
      rowKey: (row) => row.id,
      search: { placeholder: 'Search device…' },
      defaultSort: { field: 'users', direction: 'desc' },
      empty: { icon: Smartphone, title: 'No device data yet' },
      export: { filename: 'device-analytics' },
      onRowClick: canUpdate ? (row) => setEditing(row) : undefined,

      columns: [
        {
          id: 'device',
          header: 'Device',
          accessor: (row) => row.device,
          cell: (row) => <span className="font-medium">{row.device}</span>,
        },
        {
          id: 'users',
          header: 'Users',
          align: 'right',
          sortable: true,
          accessor: (row) => row.users,
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
            title: `Delete ${row.device}?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (row) => {
            await remove.mutateAsync(row.id)
            notify.success(`${row.device} deleted`)
          },
        },
      ],
    }),
    [canDelete, canUpdate, remove],
  )

  const table = useTableState({ schema, total })
  const list = deviceAnalytics.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []

  return (
    <>
      <ListPage
        title="Device Analytics"
        description="Users broken down by device type."
        toolbar={<AnalyticsTabs active="device" />}
        actions={
          canCreate && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New device
            </Button>
          )
        }
        stats={[
          { label: 'Devices', value: total ?? '—', icon: Smartphone, isLoading: list.isLoading },
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

      <DeviceEditorModal
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

export default DeviceListPage
