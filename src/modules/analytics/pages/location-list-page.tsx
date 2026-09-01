import { useEffect, useMemo, useState } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'

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
import { LocationEditorModal } from '../components/location-editor-modal'
import { locationAnalytics } from '../services/location-analytics.queries'
import type { LocationAnalytic } from '../types'

export function LocationListPage() {
  const canCreate = usePermission(PERMISSIONS.locationAnalyticsCreate)
  const canUpdate = usePermission(PERMISSIONS.locationAnalyticsUpdate)
  const canDelete = usePermission(PERMISSIONS.locationAnalyticsDelete)

  const remove = locationAnalytics.useRemove()

  const [total, setTotal] = useState<number | undefined>(undefined)
  const [editing, setEditing] = useState<LocationAnalytic | null>(null)
  const [isCreating, setCreating] = useState(false)

  const schema = useMemo<TableSchema<LocationAnalytic>>(
    () => ({
      rowKey: (row) => row.id,
      search: { placeholder: 'Search country…' },
      defaultSort: { field: 'users', direction: 'desc' },
      empty: { icon: MapPin, title: 'No location data yet' },
      export: { filename: 'location-analytics' },
      onRowClick: canUpdate ? (row) => setEditing(row) : undefined,

      columns: [
        {
          id: 'country',
          header: 'Country',
          accessor: (row) => row.country,
          cell: (row) => <span className="font-medium">{row.country}</span>,
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
            title: `Delete ${row.country}?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (row) => {
            await remove.mutateAsync(row.id)
            notify.success(`${row.country} deleted`)
          },
        },
      ],
    }),
    [canDelete, canUpdate, remove],
  )

  const table = useTableState({ schema, total })
  const list = locationAnalytics.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []

  return (
    <>
      <ListPage
        title="Location Analytics"
        description="Users broken down by country."
        toolbar={<AnalyticsTabs active="location" />}
        actions={
          canCreate && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New location
            </Button>
          )
        }
        stats={[
          { label: 'Countries', value: total ?? '—', icon: MapPin, isLoading: list.isLoading },
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

      <LocationEditorModal
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

export default LocationListPage
