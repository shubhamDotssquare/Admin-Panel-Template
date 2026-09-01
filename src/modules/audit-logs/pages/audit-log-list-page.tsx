import { useEffect, useMemo, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { useNavigate } from 'react-router'

import { CrudTable } from '@/components/data-table'
import { ListPage } from '@/components/patterns'
import { useTableState } from '@/hooks/use-table-state'
import { usePermission } from '@/hooks/use-permission'
import { PERMISSIONS } from '@/types/rbac.types'
import { PATHS, route } from '@/router/paths'
import type { TableSchema } from '@/types/table.types'
import { formatDateTime } from '@/utils/format'
import { truncate } from '@/utils/string'
import { auditLogs } from '../services/audit-log.queries'
import type { AuditLogEntry } from '../types'

/** Where this module's screens live, derived from the reserved base path. */
const paths = {
  list: PATHS.auditLogs,
  detail: (id: string) => route(PATHS.auditLogs, id),
}

export function AuditLogListPage() {
  const navigate = useNavigate()
  const canRead = usePermission(PERMISSIONS.auditLogsRead)

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<AuditLogEntry>>(
    () => ({
      rowKey: (entry) => entry.id,
      search: { placeholder: 'Search audit logs…' },
      defaultSort: { field: 'createdAt', direction: 'desc' },
      // Read-only resource: no row or bulk actions, just navigation to detail.
      onRowClick: canRead ? (entry) => navigate(paths.detail(entry.id)) : undefined,
      empty: {
        icon: ScrollText,
        title: 'No audit log entries',
        description: 'Activity will appear here as it happens.',
      },
      export: {
        filename: 'audit-logs',
        fetchAll: async () => (await auditLogs.service.list({ limit: 500 })).items,
      },

      filters: [
        { id: 'action', label: 'Action', type: 'text', placeholder: 'e.g. user.created' },
        { id: 'entity', label: 'Entity', type: 'text', placeholder: 'e.g. User' },
      ],

      columns: [
        {
          id: 'action',
          header: 'Action',
          accessor: (entry) => entry.action,
          cell: (entry) => <code className="font-mono text-caption">{entry.action}</code>,
        },
        {
          id: 'entity',
          header: 'Entity',
          accessor: (entry) => entry.entity,
        },
        {
          id: 'entityId',
          header: 'Entity ID',
          accessor: (entry) => entry.entityId ?? '',
          cell: (entry) =>
            entry.entityId ? (
              <code className="font-mono text-caption">{truncate(entry.entityId, 8)}</code>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          id: 'adminId',
          header: 'Admin ID',
          accessor: (entry) => entry.adminId ?? '',
          cell: (entry) =>
            entry.adminId ? (
              <code className="font-mono text-caption">{truncate(entry.adminId, 8)}</code>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          id: 'createdAt',
          header: 'Created',
          sortable: true,
          accessor: (entry) => entry.createdAt,
          cell: (entry) => formatDateTime(entry.createdAt),
        },
      ],
    }),
    [canRead, navigate],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = auditLogs.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []

  return (
    <ListPage
      title="Audit logs"
      description="Read-only history of actions taken across the system."
      stats={[{ label: 'Total entries', value: total ?? '—', icon: ScrollText, isLoading: list.isLoading }]}
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

export default AuditLogListPage
