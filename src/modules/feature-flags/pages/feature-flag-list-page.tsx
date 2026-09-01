import { useEffect, useMemo, useState } from 'react'
import { Eye, Flag, Pencil, Power, Trash2 } from 'lucide-react'
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
import { truncate } from '@/utils/string'
import { notify } from '@/utils/toast'
import { featureFlags, useToggleFeatureFlag } from '../services/feature-flag.queries'
import type { FeatureFlag } from '../types'

/** Where this module's screens live, derived from the reserved base path. */
const paths = {
  list: PATHS.featureFlags,
  create: route(PATHS.featureFlags, 'new'),
  detail: (id: string) => route(PATHS.featureFlags, id),
  edit: (id: string) => route(PATHS.featureFlags, id, 'edit'),
}

export function FeatureFlagListPage() {
  const navigate = useNavigate()
  const remove = featureFlags.useRemove()
  const toggle = useToggleFeatureFlag()

  const canCreate = usePermission(PERMISSIONS.featureFlagsCreate)
  const canUpdate = usePermission(PERMISSIONS.featureFlagsUpdate)
  const canDelete = usePermission(PERMISSIONS.featureFlagsDelete)

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<FeatureFlag>>(
    () => ({
      rowKey: (flag) => flag.id,
      search: { placeholder: 'Search key or name…' },
      defaultSort: { field: 'name', direction: 'asc' },
      onRowClick: (flag) => navigate(paths.detail(flag.id)),
      empty: {
        icon: Flag,
        title: 'No feature flags yet',
        description: 'Add the first flag to get started.',
      },
      export: {
        filename: 'feature-flags',
        fetchAll: async () => (await featureFlags.service.list({ limit: 500 })).items,
      },

      filters: [
        {
          id: 'enabled',
          label: 'Enabled',
          type: 'select',
          options: [
            { label: 'Enabled', value: 'true' },
            { label: 'Disabled', value: 'false' },
          ],
        },
      ],

      columns: [
        {
          id: 'key',
          header: 'Key',
          sortable: true,
          accessor: (flag) => flag.key,
          cell: (flag) => <span className="font-mono text-caption">{flag.key}</span>,
        },
        {
          id: 'name',
          header: 'Name',
          sortable: true,
          accessor: (flag) => flag.name,
          cell: (flag) => <span className="font-medium">{flag.name}</span>,
        },
        {
          id: 'description',
          header: 'Description',
          accessor: (flag) => flag.description ?? '',
          cell: (flag) =>
            flag.description ? (
              <span className="text-muted-foreground">{truncate(flag.description, 80)}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          id: 'enabled',
          header: 'Enabled',
          accessor: (flag) => (flag.enabled ? 'Enabled' : 'Disabled'),
          cell: (flag) => (
            <Badge variant={flag.enabled ? 'default' : 'outline'}>
              {flag.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          ),
        },
        {
          id: 'updatedAt',
          header: 'Updated',
          sortable: true,
          accessor: (flag) => flag.updatedAt,
          cell: (flag) => formatDate(flag.updatedAt),
        },
      ],

      rowActions: [
        {
          id: 'view',
          label: 'View',
          icon: Eye,
          onSelect: (flag) => navigate(paths.detail(flag.id)),
        },
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (flag) => navigate(paths.edit(flag.id)),
        },
        {
          id: 'toggle',
          label: (flag) => (flag.enabled ? 'Disable' : 'Enable'),
          icon: Power,
          hidden: () => !canUpdate,
          // Only confirm the destructive direction — turning a flag off can
          // change behaviour for every user, turning it on is comparatively
          // low-stakes and does not need a dialog in the way.
          confirm: (flag: FeatureFlag) =>
            flag.enabled
              ? {
                  title: `Disable ${flag.name}?`,
                  description: 'This turns the associated behaviour off immediately.',
                  confirmLabel: 'Disable',
                  destructive: true,
                }
              : undefined,
          onSelect: async (flag) => {
            await toggle.mutateAsync(flag.id)
            notify.success(flag.enabled ? `${flag.name} disabled` : `${flag.name} enabled`)
          },
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          confirm: (flag) => ({
            title: `Delete ${flag.name}?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (flag) => {
            await remove.mutateAsync(flag.id)
            notify.success(`${flag.name} deleted`)
          },
        },
      ],
    }),
    [canDelete, canUpdate, navigate, remove, toggle],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = featureFlags.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []
  const enabledCount = rows.filter((flag) => flag.enabled).length

  return (
    <ListPage
      title="Feature flags"
      description="Toggle behaviour on and off without a deploy."
      actions={
        canCreate && (
          <Button asChild size="sm">
            <Link to={paths.create}>
              <Flag className="size-4" />
              Add flag
            </Link>
          </Button>
        )
      }
      stats={[
        { label: 'Total flags', value: total ?? '—', icon: Flag, isLoading: list.isLoading },
        { label: 'Enabled (page)', value: enabledCount, icon: Power },
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

export default FeatureFlagListPage
