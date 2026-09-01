import { FileText, Info, Pencil, Search, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { DescriptionList, DetailPage, StatusBadge } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirm } from '@/hooks/use-confirm'
import { usePermission } from '@/hooks/use-permission'
import { PATHS, route } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import { formatDate } from '@/utils/format'
import { notify } from '@/utils/toast'
import { cmsPages } from '../services/cms-page.queries'
import { CMS_PAGE_STATUS } from '../types'

export function CmsPageDetailPage() {
  const { pageId } = useParams<{ pageId: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const { data: page, isLoading, isError } = cmsPages.useDetail(pageId)
  const remove = cmsPages.useRemove()
  const canUpdate = usePermission(PERMISSIONS.cmsPagesUpdate)
  const canDelete = usePermission(PERMISSIONS.cmsPagesDelete)

  if (isError || (!isLoading && !page)) {
    return (
      <PageContainer>
        <EmptyState
          title="Page not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={PATHS.cms}>Back to pages</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const title = page?.title ?? 'Loading…'

  const handleDelete = async (): Promise<void> => {
    if (!page) return

    const ok = await confirm({
      title: `Delete ${page.title}?`,
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'destructive',
    })
    if (!ok) return

    await remove.mutateAsync(page.id)
    notify.success(`${page.title} deleted`)
    navigate(PATHS.cms)
  }

  return (
    <DetailPage
      title={title}
      subtitle={page?.slug}
      isLoading={isLoading}
      backTo={PATHS.cms}
      backLabel="Back to pages"
      status={page && <StatusBadge status={page.status} map={CMS_PAGE_STATUS} />}
      meta={
        page
          ? [
              {
                label: 'Published',
                value: page.publishedAt ? formatDate(page.publishedAt) : 'Not published',
              },
              { label: 'Updated', value: formatDate(page.updatedAt) },
            ]
          : undefined
      }
      actions={
        page && (
          <>
            {canUpdate && (
              <Button asChild variant="outline" size="sm">
                <Link to={route(PATHS.cms, page.id, 'edit')}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                disabled={remove.isPending}
                onClick={() => void handleDelete()}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </>
        )
      }
      tabs={[
        {
          id: 'overview',
          label: 'Overview',
          icon: Info,
          content: (
            <Card>
              <CardContent>
                <DescriptionList
                  isLoading={isLoading}
                  items={[
                    { label: 'Title', value: page?.title },
                    { label: 'Slug', value: page && <code className="font-mono">{page.slug}</code> },
                    {
                      label: 'Status',
                      value: page && <StatusBadge status={page.status} map={CMS_PAGE_STATUS} />,
                    },
                    { label: 'Created', value: page?.createdAt ? formatDate(page.createdAt) : '—' },
                    { label: 'Updated', value: page?.updatedAt ? formatDate(page.updatedAt) : '—' },
                    { label: 'Page ID', value: page?.id },
                  ]}
                />
              </CardContent>
            </Card>
          ),
        },
        {
          id: 'content',
          label: 'Content',
          icon: FileText,
          content: (
            <Card>
              <CardContent>
                {page?.content ? (
                  <p className="whitespace-pre-wrap text-body">{page.content}</p>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No content"
                    description="Add a body from the edit screen."
                    className="border-none"
                  />
                )}
              </CardContent>
            </Card>
          ),
        },
        {
          id: 'seo',
          label: 'SEO',
          icon: Search,
          content: (
            <Card>
              <CardContent>
                <DescriptionList
                  isLoading={isLoading}
                  items={[
                    { label: 'SEO title', value: page?.seoTitle || '—' },
                    { label: 'SEO description', value: page?.seoDescription || '—' },
                  ]}
                />
              </CardContent>
            </Card>
          ),
        },
      ]}
    />
  )
}

export default CmsPageDetailPage
