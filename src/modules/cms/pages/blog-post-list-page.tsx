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
import { blogPosts } from '../services/blog-post.queries'
import { BLOG_STATUS, BLOG_STATUS_OPTIONS, type BlogPost } from '../types'

/** Where this module's screens live, derived from the reserved base path. */
const paths = {
  list: route(PATHS.cms, 'blog'),
  create: route(PATHS.cms, 'blog', 'new'),
  detail: (id: string) => route(PATHS.cms, 'blog', id),
  edit: (id: string) => route(PATHS.cms, 'blog', id, 'edit'),
  pagesList: PATHS.cms,
}

export function BlogPostListPage() {
  const navigate = useNavigate()
  const remove = blogPosts.useRemove()

  const canCreate = usePermission(PERMISSIONS.blogPostsCreate)
  const canUpdate = usePermission(PERMISSIONS.blogPostsUpdate)
  const canDelete = usePermission(PERMISSIONS.blogPostsDelete)

  const [total, setTotal] = useState<number | undefined>(undefined)

  const schema = useMemo<TableSchema<BlogPost>>(
    () => ({
      rowKey: (post) => post.id,
      search: { placeholder: 'Search title or slug…' },
      defaultSort: { field: 'updatedAt', direction: 'desc' },
      onRowClick: (post) => navigate(paths.detail(post.id)),
      empty: {
        icon: Newspaper,
        title: 'No blog posts yet',
        description: 'Add the first post to get started.',
      },
      export: {
        filename: 'blog-posts',
        fetchAll: async () => (await blogPosts.service.list({ limit: 500 })).items,
      },

      filters: [{ id: 'status', label: 'Status', type: 'select', options: BLOG_STATUS_OPTIONS }],

      columns: [
        {
          id: 'title',
          header: 'Title',
          sortable: true,
          accessor: (post) => post.title,
          cell: (post) => <span className="font-medium">{post.title}</span>,
        },
        {
          id: 'slug',
          header: 'Slug',
          accessor: (post) => post.slug,
          cell: (post) => <span className="font-mono text-caption">{post.slug}</span>,
        },
        {
          id: 'category',
          header: 'Category',
          accessor: (post) => post.category ?? '',
          cell: (post) => post.category ?? <span className="text-muted-foreground">—</span>,
        },
        {
          id: 'author',
          header: 'Author',
          accessor: (post) => post.author ?? '',
          cell: (post) => post.author ?? <span className="text-muted-foreground">—</span>,
        },
        {
          id: 'status',
          header: 'Status',
          accessor: (post) => BLOG_STATUS[post.status]?.label ?? post.status,
          cell: (post) => <StatusBadge status={post.status} map={BLOG_STATUS} />,
        },
        {
          id: 'views',
          header: 'Views',
          align: 'right',
          sortable: true,
          accessor: (post) => post.views,
        },
        {
          id: 'updatedAt',
          header: 'Updated',
          sortable: true,
          accessor: (post) => post.updatedAt,
          cell: (post) => formatDate(post.updatedAt),
        },
      ],

      rowActions: [
        {
          id: 'edit',
          label: 'Edit',
          icon: Pencil,
          hidden: () => !canUpdate,
          onSelect: (post) => navigate(paths.edit(post.id)),
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          destructive: true,
          hidden: () => !canDelete,
          confirm: (post) => ({
            title: `Delete ${post.title}?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete',
          }),
          onSelect: async (post) => {
            await remove.mutateAsync(post.id)
            notify.success(`${post.title} deleted`)
          },
        },
      ],
    }),
    [canDelete, canUpdate, navigate, remove],
  )

  const table = useTableState({ schema, syncToUrl: true, total })
  const list = blogPosts.useList(table.params)

  useEffect(() => {
    setTotal(list.data?.pagination.total)
  }, [list.data?.pagination.total])

  const rows = list.data?.items ?? []
  const countBy = (status: BlogPost['status']): number =>
    rows.filter((post) => post.status === status).length

  return (
    <ListPage
      title="Blog"
      description="Editorial posts — articles, announcements, updates."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={paths.pagesList}>
              <FileText className="size-4" />
              Pages
            </Link>
          </Button>
          {canCreate && (
            <Button asChild size="sm">
              <Link to={paths.create}>
                <Plus className="size-4" />
                New post
              </Link>
            </Button>
          )}
        </div>
      }
      stats={[
        { label: 'Total posts', value: total ?? '—', icon: Newspaper, isLoading: list.isLoading },
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

export default BlogPostListPage
