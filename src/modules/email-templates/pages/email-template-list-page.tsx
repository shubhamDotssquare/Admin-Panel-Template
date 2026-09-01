import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { emailTemplates } from '../services/email-template.queries'
import { EMAIL_TEMPLATE_STATUS, EMAIL_TEMPLATE_STATUS_OPTIONS, type EmailTemplate } from '../types'

/** Where this module's screens live, derived from the reserved base path. */
const paths = {
  list: PATHS.emailTemplates,
  create: route(PATHS.emailTemplates, 'new'),
  detail: (id: string) => route(PATHS.emailTemplates, id),
  edit: (id: string) => route(PATHS.emailTemplates, id, 'edit'),
}

export function EmailTemplateListPage() {
  const navigate = useNavigate()
  const remove = emailTemplates.useRemove()

  const canCreate = usePermission(PERMISSIONS.emailTemplatesCreate)
  const canUpdate = usePermission(PERMISSIONS.emailTemplatesUpdate)
  const canDelete = usePermission(PERMISSIONS.emailTemplatesDelete)

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<EmailTemplate>>(
    () => ({
      rowKey: (template) => template.id,
      search: { placeholder: 'Search name, key or subject…' },
      defaultSort: { field: 'name', direction: 'asc' },
      onRowClick: (template) => navigate(paths.detail(template.id)),
      empty: {
        icon: FileText,
        title: 'No email templates yet',
        description: 'Add the first template to get started.',
      },
      export: {
        filename: 'email-templates',
        fetchAll: async () => (await emailTemplates.service.list({ limit: 500 })).items,
      },

      filters: [
        { id: 'status', label: 'Status', type: 'select', options: EMAIL_TEMPLATE_STATUS_OPTIONS },
      ],

      columns: [
        {
          id: 'name',
          header: 'Name',
          sortable: true,
          accessor: (template) => template.name,
          cell: (template) => <span className="font-medium">{template.name}</span>,
        },
        {
          id: 'key',
          header: 'Key',
          sortable: true,
          accessor: (template) => template.key,
          cell: (template) => <span className="font-mono text-caption">{template.key}</span>,
        },
        {
          id: 'subject',
          header: 'Subject',
          accessor: (template) => template.subject,
          cell: (template) => (
            <span className="block max-w-xs truncate">{template.subject}</span>
          ),
        },
        {
          id: 'status',
          header: 'Status',
          accessor: (template) => EMAIL_TEMPLATE_STATUS[template.status]?.label ?? template.status,
          cell: (template) => <StatusBadge status={template.status} map={EMAIL_TEMPLATE_STATUS} />,
        },
        {
          id: 'createdAt',
          header: 'Created',
          sortable: true,
          defaultHidden: true,
          accessor: (template) => template.createdAt ?? '',
          cell: (template) => (template.createdAt ? formatDate(template.createdAt) : '—'),
        },
      ],

      rowActions: [
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (template) => navigate(paths.edit(template.id)),
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          confirm: (template) => ({
            title: `Delete ${template.name}?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (template) => {
            await remove.mutateAsync(template.id)
            notify.success(`${template.name} deleted`)
          },
        },
      ],
    }),
    [canDelete, canUpdate, navigate, remove],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = emailTemplates.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []
  const countBy = (status: EmailTemplate['status']): number =>
    rows.filter((template) => template.status === status).length

  return (
    <ListPage
      title="Email Templates"
      description="Templates used to send transactional and marketing email."
      actions={
        canCreate && (
          <Button asChild size="sm">
            <Link to={paths.create}>
              <Plus className="size-4" />
              New template
            </Link>
          </Button>
        )
      }
      stats={[
        { label: 'Total templates', value: total ?? '—', icon: FileText, isLoading: list.isLoading },
        { label: 'Active (page)', value: countBy('ACTIVE'), icon: CheckCircle2 },
        { label: 'Draft (page)', value: countBy('DRAFT') },
        { label: 'Archived (page)', value: countBy('ARCHIVED') },
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

export default EmailTemplateListPage
