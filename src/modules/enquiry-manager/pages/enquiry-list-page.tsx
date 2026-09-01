import { useEffect, useMemo, useState } from 'react'
import { Inbox, MailPlus, Pencil, Trash2 } from 'lucide-react'
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
import { notify } from '@/utils/toast'
import { enquiries } from '../services/enquiry.queries'
import {
  ENQUIRY_PRIORITY,
  ENQUIRY_PRIORITY_OPTIONS,
  ENQUIRY_STATUS,
  ENQUIRY_STATUS_OPTIONS,
  type Enquiry,
} from '../types'

/** Where this module's screens live, derived from the reserved base path. */
const paths = {
  list: PATHS.enquiryManager,
  create: route(PATHS.enquiryManager, 'new'),
  detail: (id: string) => route(PATHS.enquiryManager, id),
  edit: (id: string) => route(PATHS.enquiryManager, id, 'edit'),
}

export function EnquiryListPage() {
  const navigate = useNavigate()
  const remove = enquiries.useRemove()

  const canCreate = usePermission(PERMISSIONS.enquiriesCreate)
  const canUpdate = usePermission(PERMISSIONS.enquiriesUpdate)
  const canDelete = usePermission(PERMISSIONS.enquiriesDelete)

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<Enquiry>>(
    () => ({
      rowKey: (enquiry) => enquiry.id,
      search: { placeholder: 'Search name or email…' },
      defaultSort: { field: 'createdAt', direction: 'desc' },
      onRowClick: canUpdate ? (enquiry) => navigate(paths.detail(enquiry.id)) : undefined,
      empty: {
        icon: Inbox,
        title: 'No enquiries yet',
        description: 'Submissions will show up here as they come in.',
      },
      export: {
        filename: 'enquiries',
        fetchAll: async () => (await enquiries.service.list({ limit: 500 })).items,
      },

      filters: [
        { id: 'status', label: 'Status', type: 'select', options: ENQUIRY_STATUS_OPTIONS },
        {
          id: 'priority',
          label: 'Priority',
          type: 'select',
          options: ENQUIRY_PRIORITY_OPTIONS,
        },
      ],

      columns: [
        {
          id: 'name',
          header: 'Name',
          sortable: true,
          accessor: (enquiry) => enquiry.name,
          cell: (enquiry) => (
            <div className="flex flex-col">
              <span className="font-medium">{enquiry.name}</span>
              <span className="text-caption text-muted-foreground">{enquiry.email}</span>
            </div>
          ),
        },
        {
          id: 'subject',
          header: 'Subject',
          sortable: true,
          accessor: (enquiry) => enquiry.subject,
        },
        {
          id: 'category',
          header: 'Category',
          sortable: true,
          accessor: (enquiry) => enquiry.category,
        },
        {
          id: 'priority',
          header: 'Priority',
          accessor: (enquiry) => ENQUIRY_PRIORITY[enquiry.priority]?.label ?? enquiry.priority,
          cell: (enquiry) => <StatusBadge status={enquiry.priority} map={ENQUIRY_PRIORITY} />,
        },
        {
          id: 'status',
          header: 'Status',
          accessor: (enquiry) => ENQUIRY_STATUS[enquiry.status]?.label ?? enquiry.status,
          cell: (enquiry) => <StatusBadge status={enquiry.status} map={ENQUIRY_STATUS} />,
        },
        {
          id: 'createdAt',
          header: 'Created',
          sortable: true,
          accessor: (enquiry) => enquiry.createdAt,
          cell: (enquiry) => formatDate(enquiry.createdAt),
        },
      ],

      rowActions: [
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (enquiry) => navigate(paths.edit(enquiry.id)),
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          confirm: (enquiry) => ({
            title: `Delete "${enquiry.subject}"?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (enquiry) => {
            await remove.mutateAsync(enquiry.id)
            notify.success('Enquiry deleted')
          },
        },
      ],
    }),
    [canDelete, canUpdate, navigate, remove],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = enquiries.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []

  return (
    <ListPage
      title="Enquiries"
      description="Contact and support submissions awaiting triage."
      actions={
        canCreate && (
          <Button asChild size="sm">
            <Link to={paths.create}>
              <MailPlus className="size-4" />
              New enquiry
            </Link>
          </Button>
        )
      }
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

export default EnquiryListPage
