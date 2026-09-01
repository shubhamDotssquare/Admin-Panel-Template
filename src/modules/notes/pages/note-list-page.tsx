import { useEffect, useMemo, useState } from 'react'
import { Eye, FileText, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { CrudTable } from '@/components/data-table'
import { ListPage, StatusBadge } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { useTableState } from '@/hooks/use-table-state'
import { usePermission } from '@/hooks/use-permission'
import { PERMISSIONS } from '@/types/rbac.types'
import { PATHS, route } from '@/router/paths'
import type { TableSchema } from '@/types/table.types'
import { formatDate } from '@/utils/format'
import { truncate } from '@/utils/string'
import { notify } from '@/utils/toast'
import { notes, useRestoreNote } from '../services/note.queries'
import { NOTE_FILTER_OPTIONS, NOTE_STATUS, type Note } from '../types'

/** Where this module's screens live, derived from the reserved base path. */
const paths = {
  list: PATHS.notes,
  create: route(PATHS.notes, 'new'),
  detail: (id: string) => route(PATHS.notes, id),
  edit: (id: string) => route(PATHS.notes, id, 'edit'),
}

export function NoteListPage() {
  const navigate = useNavigate()
  const remove = notes.useRemove()
  const restore = useRestoreNote()

  const canCreate = usePermission(PERMISSIONS.notesCreate)
  const canUpdate = usePermission(PERMISSIONS.notesUpdate)
  const canDelete = usePermission(PERMISSIONS.notesDelete)

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<Note>>(
    () => ({
      rowKey: (note) => note.id,
      search: { placeholder: 'Search title or body…' },
      defaultSort: { field: 'updatedAt', direction: 'desc' },
      onRowClick: (note) => navigate(paths.detail(note.id)),
      empty: {
        icon: FileText,
        title: 'No notes yet',
        description: 'Add the first note to get started.',
      },
      export: {
        filename: 'notes',
        fetchAll: async () => (await notes.service.list({ limit: 500 })).items,
      },

      filters: [{ id: 'status', label: 'Status', type: 'select', options: NOTE_FILTER_OPTIONS }],

      columns: [
        {
          id: 'title',
          header: 'Title',
          sortable: true,
          accessor: (note) => note.title,
          cell: (note) => <span className="font-medium">{note.title}</span>,
        },
        {
          id: 'body',
          header: 'Body',
          accessor: (note) => note.body ?? '',
          cell: (note) =>
            note.body ? (
              <span className="text-muted-foreground">{truncate(note.body, 80)}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          id: 'status',
          header: 'Status',
          accessor: (note) => NOTE_STATUS[note.status]?.label ?? note.status,
          cell: (note) => <StatusBadge status={note.status} map={NOTE_STATUS} />,
        },
        {
          id: 'updatedAt',
          header: 'Updated',
          sortable: true,
          accessor: (note) => note.updatedAt,
          cell: (note) => formatDate(note.updatedAt),
        },
      ],

      rowActions: [
        {
          id: 'view',
          label: 'View',
          icon: Eye,
          onSelect: (note) => navigate(paths.detail(note.id)),
        },
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: (note) => !canUpdate || note.status === 'DELETED',
          onSelect: (note) => navigate(paths.edit(note.id)),
        },
        {
          id: 'restore',
          label: 'Restore',
          icon: RotateCcw,
          hidden: (note) => !canUpdate || note.status !== 'DELETED',
          onSelect: async (note) => {
            await restore.mutateAsync(note.id)
            notify.success(`${note.title} restored`)
          },
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: (note) => !canDelete || note.status === 'DELETED',
          confirm: (note) => ({
            title: `Delete ${note.title}?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (note) => {
            await remove.mutateAsync(note.id)
            notify.success(`${note.title} deleted`)
          },
        },
      ],
    }),
    [canDelete, canUpdate, navigate, remove, restore],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = notes.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []
  const countBy = (status: Note['status']): number =>
    rows.filter((note) => note.status === status).length

  return (
    <ListPage
      title="Notes"
      description="Free-form notes, with soft-delete and restore."
      actions={
        canCreate && (
          <Button asChild size="sm">
            <Link to={paths.create}>
              <FileText className="size-4" />
              Add note
            </Link>
          </Button>
        )
      }
      stats={[
        { label: 'Total notes', value: total ?? '—', icon: FileText, isLoading: list.isLoading },
        { label: 'Active (page)', value: countBy('ACTIVE') },
        { label: 'Deleted (page)', value: countBy('DELETED') },
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

export default NoteListPage
