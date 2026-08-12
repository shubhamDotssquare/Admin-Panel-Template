import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, KeyRound, ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router'

import { CrudTable } from '@/components/data-table'
import { ListPage } from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTableState } from '@/hooks/use-table-state'
import { PATHS } from '@/router/paths'
import type { TableSchema } from '@/types/table.types'
import { roles } from '../services/admin.queries'
import type { Role } from '../types'

/**
 * Roles and the permissions they grant.
 *
 * Read-only for now: the backend has no RBAC yet, so an editor here would imply
 * an enforcement that does not exist. The screen earns its place by making the
 * vocabulary visible — the same table framework will carry editing when the
 * server can honour it.
 */
export function RoleListPage() {
  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<Role>>(
    () => ({
      rowKey: (role) => role.id,
      search: { placeholder: 'Search roles…' },
      defaultSort: { field: 'name', direction: 'asc' },
      empty: { icon: ShieldCheck, title: 'No roles defined' },
      export: { filename: 'roles' },

      columns: [
        {
          id: 'name',
          header: 'Role',
          sortable: true,
          accessor: (role) => role.name,
          cell: (role) => (
            <div className="flex flex-col">
              <span className="flex items-center gap-2 font-medium">
                {role.name}
                {role.system && <Badge variant="outline">Built-in</Badge>}
              </span>
              {role.description && (
                <span className="text-caption text-muted-foreground">{role.description}</span>
              )}
            </div>
          ),
        },
        {
          id: 'permissions',
          header: 'Permissions',
          wrap: true,
          accessor: (role) => role.permissions.join(', '),
          cell: (role) => (
            <span className="flex flex-wrap gap-1">
              {role.permissions.slice(0, 4).map((permission) => (
                <Badge key={permission} variant="secondary" className="font-mono">
                  {permission}
                </Badge>
              ))}
              {role.permissions.length > 4 && (
                <Badge variant="outline">+{role.permissions.length - 4} more</Badge>
              )}
            </span>
          ),
        },
        {
          id: 'adminCount',
          header: 'In use',
          align: 'right',
          width: '7rem',
          sortable: true,
          accessor: (role) => role.adminCount ?? 0,
          cell: (role) => `${role.adminCount ?? 0}`,
        },
      ],
    }),
    [],
  )

  const table = useTableState({ schema, total })
  const list = roles.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.meta.total)
  }, [list.data?.meta.total])

  const rows = list.data?.items ?? []
  const permissionCount = new Set(rows.flatMap((role) => role.permissions)).size

  return (
    <ListPage
      title="Roles"
      description="What each role grants. Assign roles from an administrator’s profile."
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to={PATHS.adminManager}>
            <ArrowLeft className="size-4" />
            Back to administrators
          </Link>
        </Button>
      }
      stats={[
        { label: 'Roles', value: total ?? '—', icon: ShieldCheck, isLoading: list.isLoading },
        { label: 'Distinct permissions', value: permissionCount, icon: KeyRound },
        {
          label: 'Assignments',
          value: rows.reduce((sum, role) => sum + (role.adminCount ?? 0), 0),
          icon: Users,
        },
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

export default RoleListPage
