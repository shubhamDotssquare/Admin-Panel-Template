import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileText, Newspaper, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { cmsPages } from '../services/cms-page.queries'
import { CMS_PAGE_STATUS, CMS_PAGE_STATUS_OPTIONS, type CmsPage } from '../types'

/** Where this module's screens live, derived from the reserved base path. */
const paths = {
  list: PATHS.cms,
  create: route(PATHS.cms, 'new'),
  detail: (id: string) => route(PATHS.cms, id),
  edit: (id: string) => route(PATHS.cms, id, 'edit'),
  blogList: route(PATHS.cms, 'blog'),
}

export function CmsPageListPage() {
  const navigate = useNavigate()
  const remove = cmsPages.useRemove()

  const canCreate = usePermission(PERMISSIONS.cmsPagesCreate)
  const canUpdate = usePermission(PERMISSIONS.cmsPagesUpdate)
  const canDelete = usePermission(PERMISSIONS.cmsPagesDelete)

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<CmsPage>>(
    () => ({
      rowKey: (page) => page.id,
      search: { placeholder: 'Search title or slug…' },
      defaultSort: { field: 'updatedAt', direction: 'desc' },
      onRowClick: (page) => navigate(paths.detail(page.id)),
      empty: {
        icon: FileText,
        title: 'No pages yet',
        description: 'Add the first page to get started.',
      },
      export: {
        filename: 'cms-pages',
        fetchAll: async () => (await cmsPages.service.list({ limit: 500 })).items,
      },

      filters: [
        { id: 'status', label: 'Status', type: 'select', options: CMS_PAGE_STATUS_OPTIONS },
      ],

      columns: [
        {
          id: 'title',
          header: 'Title',
          sortable: true,
          accessor: (page) => page.title,
          cell: (page) => <span className="font-medium">{page.title}</span>,
        },
        {
          id: 'slug',
          header: 'Slug',
          accessor: (page) => page.slug,
          cell: (page) => <span className="font-mono text-caption">{page.slug}</span>,
        },
        {
          id: 'status',
          header: 'Status',
          accessor: (page) => CMS_PAGE_STATUS[page.status]?.label ?? page.status,
          cell: (page) => <StatusBadge status={page.status} map={CMS_PAGE_STATUS} />,
        },
        {
          id: 'updatedAt',
          header: 'Updated',
          sortable: true,
          accessor: (page) => page.updatedAt,
          cell: (page) => formatDate(page.updatedAt),
        },
      ],

      rowActions: [
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (page) => navigate(paths.edit(page.id)),
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          confirm: (page) => ({
            title: `Delete ${page.title}?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (page) => {
            await remove.mutateAsync(page.id)
            notify.success(`${page.title} deleted`)
          },
        },
      ],
    }),
    [canDelete, canUpdate, navigate, remove],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = cmsPages.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []
  const countBy = (status: CmsPage['status']): number =>
    rows.filter((page) => page.status === status).length

  return (
    <ListPage
      title="Pages"
      description="Static, sluggable content — about, terms, landing pages."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={paths.blogList}>
              <Newspaper className="size-4" />
              Blog
            </Link>
          </Button>
          {canCreate && (
            <Button asChild size="sm">
              <Link to={paths.create}>
                <Plus className="size-4" />
                New page
              </Link>
            </Button>
          )}
        </div>
      }
      stats={[
        { label: 'Total pages', value: total ?? '—', icon: FileText, isLoading: list.isLoading },
        { label: 'Published (page)', value: countBy('PUBLISHED'), icon: CheckCircle2 },
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

export default CmsPageListPage
