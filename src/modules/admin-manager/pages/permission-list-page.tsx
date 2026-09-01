import { useEffect, useMemo, useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Navigate } from 'react-router'

import { CrudTable } from '@/components/data-table'
import { ListPage } from '@/components/patterns'
import { useTableState } from '@/hooks/use-table-state'
import { usePermission } from '@/hooks/use-permission'
import { PATHS } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import type { TableSchema } from '@/types/table.types'
import { permissions } from '../services/role.queries'
import type { PermissionRecord } from '../types'

/**
 * Every permission the API recognises.
 *
 * Purely informational: there is no create, edit or delete endpoint for
 * `/rbac/permissions` — permissions are seeded server-side, and the only thing
 * an admin does with them is attach or detach one on a role, from that role's
 * own editor.
 */
export function PermissionListPage() {
  const canRead = usePermission(PERMISSIONS.permissionsRead)

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<PermissionRecord>>(
    () => ({
      rowKey: (permission) => permission.id,
      search: { placeholder: 'Search permissions…' },
      // Sorting by the resource's name clusters permissions the way an admin
      // actually scans them — by the feature they gate, not creation order.
      defaultSort: { field: 'resource.name', direction: 'asc' },
      empty: { icon: KeyRound, title: 'No permissions found' },
      export: { filename: 'permissions' },

      columns: [
        {
          id: 'key',
          header: 'Key',
          sortable: true,
          accessor: (permission) => permission.key,
          cell: (permission) => <span className="font-mono text-caption">{permission.key}</span>,
        },
        {
          id: 'resource',
          header: 'Resource',
          sortable: true,
          sortKey: 'resource.name',
          accessor: (permission) => permission.resource.name,
        },
        {
          id: 'action',
          header: 'Action',
          accessor: (permission) => permission.action ?? '',
          cell: (permission) =>
            permission.action ?? <span className="text-muted-foreground">—</span>,
        },
        {
          id: 'description',
          header: 'Description',
          wrap: true,
          accessor: (permission) => permission.description ?? '',
          cell: (permission) =>
            permission.description ?? <span className="text-muted-foreground">—</span>,
        },
      ],
    }),
    [],
  )

  const table = useTableState({ schema, total })
  // Skip the request entirely when the permission is absent, rather than
  // letting the server's 403 do the talking.
  const list = permissions.useList(table.params, { enabled: canRead })

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  if (!canRead) return <Navigate to={PATHS.forbidden} replace />

  const rows = list.data?.items ?? []

  return (
    <ListPage
      title="Permissions"
      description="Every permission the API recognises, grouped by the resource it protects."
      stats={[
        { label: 'Permissions', value: total ?? '—', icon: KeyRound, isLoading: list.isLoading },
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

export default PermissionListPage
