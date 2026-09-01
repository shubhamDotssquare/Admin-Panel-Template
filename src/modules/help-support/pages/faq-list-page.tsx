import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Eye, HelpCircle, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { faqs } from '../services/faq.queries'
import { FAQ_STATUS, FAQ_STATUS_OPTIONS, type Faq } from '../types'

/** Where this module's screens live, derived from the reserved base path. */
const paths = {
  list: route(PATHS.helpSupport, 'faqs'),
  create: route(PATHS.helpSupport, 'faqs', 'new'),
  detail: (id: string) => route(PATHS.helpSupport, 'faqs', id),
  edit: (id: string) => route(PATHS.helpSupport, 'faqs', id, 'edit'),
  tickets: PATHS.helpSupport,
}

export function FaqListPage() {
  const navigate = useNavigate()
  const remove = faqs.useRemove()

  const canCreate = usePermission(PERMISSIONS.faqsCreate)
  const canUpdate = usePermission(PERMISSIONS.faqsUpdate)
  const canDelete = usePermission(PERMISSIONS.faqsDelete)

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<Faq>>(
    () => ({
      rowKey: (faq) => faq.id,
      search: { placeholder: 'Search question…' },
      defaultSort: { field: 'order', direction: 'asc' },
      onRowClick: (faq) => navigate(paths.detail(faq.id)),
      empty: {
        icon: HelpCircle,
        title: 'No FAQs yet',
        description: 'Add the first frequently asked question.',
      },
      export: {
        filename: 'faqs',
        fetchAll: async () => (await faqs.service.list({ limit: 500 })).items,
      },

      filters: [{ id: 'status', label: 'Status', type: 'select', options: FAQ_STATUS_OPTIONS }],

      columns: [
        {
          id: 'question',
          header: 'Question',
          sortable: true,
          accessor: (faq) => faq.question,
          cell: (faq) => <span className="line-clamp-2 font-medium">{faq.question}</span>,
        },
        {
          id: 'category',
          header: 'Category',
          sortable: true,
          accessor: (faq) => faq.category ?? '',
          cell: (faq) => faq.category ?? <span className="text-muted-foreground">—</span>,
        },
        {
          id: 'status',
          header: 'Status',
          accessor: (faq) => FAQ_STATUS[faq.status]?.label ?? faq.status,
          cell: (faq) => <StatusBadge status={faq.status} map={FAQ_STATUS} />,
        },
        {
          id: 'order',
          header: 'Order',
          align: 'right',
          width: '6rem',
          sortable: true,
          accessor: (faq) => faq.order,
        },
        {
          id: 'updatedAt',
          header: 'Updated',
          sortable: true,
          defaultHidden: true,
          accessor: (faq) => faq.updatedAt ?? '',
          cell: (faq) => (faq.updatedAt ? formatDate(faq.updatedAt) : '—'),
        },
      ],

      rowActions: [
        {
          id: 'view',
          label: 'View',
          icon: Eye,
          onSelect: (faq) => navigate(paths.detail(faq.id)),
        },
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (faq) => navigate(paths.edit(faq.id)),
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          confirm: (faq) => ({
            title: `Delete "${faq.question}"?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (faq) => {
            await remove.mutateAsync(faq.id)
            notify.success('FAQ deleted')
          },
        },
      ],
    }),
    [canDelete, canUpdate, navigate, remove],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = faqs.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []
  const countBy = (status: Faq['status']): number =>
    rows.filter((faq) => faq.status === status).length

  return (
    <ListPage
      title="FAQs"
      description="Frequently asked questions shown to users."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={paths.tickets}>
              <ArrowLeft className="size-4" />
              Support tickets
            </Link>
          </Button>
          {canCreate && (
            <Button asChild size="sm">
              <Link to={paths.create}>
                <Plus className="size-4" />
                New FAQ
              </Link>
            </Button>
          )}
        </div>
      }
      stats={[
        {
          label: 'Total FAQs',
          value: total ?? '—',
          icon: HelpCircle,
          isLoading: list.isLoading,
        },
        { label: 'Published (page)', value: countBy('PUBLISHED') },
        { label: 'Draft (page)', value: countBy('DRAFT') },
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

export default FaqListPage
