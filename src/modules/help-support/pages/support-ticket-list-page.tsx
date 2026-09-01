import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Eye, LifeBuoy, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { supportTickets } from '../services/support-ticket.queries'
import {
  SUPPORT_TICKET_PRIORITY,
  SUPPORT_TICKET_PRIORITY_OPTIONS,
  SUPPORT_TICKET_STATUS,
  SUPPORT_TICKET_STATUS_OPTIONS,
  type SupportTicket,
} from '../types'

/** Where this module's screens live, derived from the reserved base path. */
const paths = {
  list: PATHS.helpSupport,
  create: route(PATHS.helpSupport, 'new'),
  detail: (id: string) => route(PATHS.helpSupport, id),
  edit: (id: string) => route(PATHS.helpSupport, id, 'edit'),
  faqs: route(PATHS.helpSupport, 'faqs'),
}

export function SupportTicketListPage() {
  const navigate = useNavigate()
  const remove = supportTickets.useRemove()

  const canCreate = usePermission(PERMISSIONS.supportTicketsCreate)
  const canUpdate = usePermission(PERMISSIONS.supportTicketsUpdate)
  const canDelete = usePermission(PERMISSIONS.supportTicketsDelete)

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<SupportTicket>>(
    () => ({
      rowKey: (ticket) => ticket.id,
      search: { placeholder: 'Search subject or category…' },
      defaultSort: { field: 'createdAt', direction: 'desc' },
      onRowClick: (ticket) => navigate(paths.detail(ticket.id)),
      empty: {
        icon: LifeBuoy,
        title: 'No support tickets yet',
        description: 'Tickets raised by users will show up here.',
      },
      export: {
        filename: 'support-tickets',
        fetchAll: async () => (await supportTickets.service.list({ limit: 500 })).items,
      },

      filters: [
        {
          id: 'status',
          label: 'Status',
          type: 'select',
          options: SUPPORT_TICKET_STATUS_OPTIONS,
        },
        {
          id: 'priority',
          label: 'Priority',
          type: 'select',
          options: SUPPORT_TICKET_PRIORITY_OPTIONS,
        },
      ],

      columns: [
        {
          id: 'ticketNumber',
          header: 'Ticket',
          sortable: true,
          accessor: (ticket) => ticket.ticketNumber,
          cell: (ticket) => (
            <span className="font-mono text-caption">{ticket.ticketNumber}</span>
          ),
          width: '9rem',
        },
        {
          id: 'subject',
          header: 'Subject',
          sortable: true,
          accessor: (ticket) => ticket.subject,
          cell: (ticket) => (
            <div className="flex flex-col">
              <span className="font-medium">{ticket.subject}</span>
              {ticket.userEmail && (
                <span className="text-caption text-muted-foreground">{ticket.userEmail}</span>
              )}
            </div>
          ),
        },
        {
          id: 'category',
          header: 'Category',
          sortable: true,
          accessor: (ticket) => ticket.category,
        },
        {
          id: 'priority',
          header: 'Priority',
          accessor: (ticket) =>
            SUPPORT_TICKET_PRIORITY[ticket.priority]?.label ?? ticket.priority,
          cell: (ticket) => (
            <StatusBadge status={ticket.priority} map={SUPPORT_TICKET_PRIORITY} />
          ),
        },
        {
          id: 'status',
          header: 'Status',
          accessor: (ticket) => SUPPORT_TICKET_STATUS[ticket.status]?.label ?? ticket.status,
          cell: (ticket) => <StatusBadge status={ticket.status} map={SUPPORT_TICKET_STATUS} />,
        },
        {
          id: 'createdAt',
          header: 'Created',
          sortable: true,
          accessor: (ticket) => ticket.createdAt ?? '',
          cell: (ticket) => (ticket.createdAt ? formatDate(ticket.createdAt) : '—'),
        },
      ],

      rowActions: [
        {
          id: 'view',
          label: 'View',
          icon: Eye,
          onSelect: (ticket) => navigate(paths.detail(ticket.id)),
        },
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (ticket) => navigate(paths.edit(ticket.id)),
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          confirm: (ticket) => ({
            title: `Delete ${ticket.ticketNumber}?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (ticket) => {
            await remove.mutateAsync(ticket.id)
            notify.success(`${ticket.ticketNumber} deleted`)
          },
        },
      ],
    }),
    [canDelete, canUpdate, navigate, remove],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = supportTickets.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []
  const countBy = (status: SupportTicket['status']): number =>
    rows.filter((ticket) => ticket.status === status).length

  return (
    <ListPage
      title="Support Tickets"
      description="Issues and requests raised by users."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={paths.faqs}>
              FAQs
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          {canCreate && (
            <Button asChild size="sm">
              <Link to={paths.create}>
                <Plus className="size-4" />
                New ticket
              </Link>
            </Button>
          )}
        </div>
      }
      stats={[
        {
          label: 'Total tickets',
          value: total ?? '—',
          icon: LifeBuoy,
          isLoading: list.isLoading,
        },
        { label: 'Open (page)', value: countBy('OPEN') },
        { label: 'In progress (page)', value: countBy('IN_PROGRESS') },
        { label: 'Resolved (page)', value: countBy('RESOLVED') },
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

export default SupportTicketListPage
