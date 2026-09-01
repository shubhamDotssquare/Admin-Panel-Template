import { Info, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { DescriptionList, DetailPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirm } from '@/hooks/use-confirm'
import { usePermission } from '@/hooks/use-permission'
import { PATHS, route } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import { formatDateTime } from '@/utils/format'
import { notify } from '@/utils/toast'
import { activityFeed } from '../services/activity-feed.queries'

export function ActivityFeedDetailPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const { data: item, isLoading, isError } = activityFeed.useDetail(itemId)
  const remove = activityFeed.useRemove()

  const canUpdate = usePermission(PERMISSIONS.activityFeedUpdate)
  const canDelete = usePermission(PERMISSIONS.activityFeedDelete)

  if (isError || (!isLoading && !item)) {
    return (
      <PageContainer>
        <EmptyState
          title="Entry not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={PATHS.activityFeed}>Back to activity feed</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const handleDelete = async (): Promise<void> => {
    if (!item) return

    const ok = await confirm({
      title: 'Delete this entry?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'destructive',
    })
    if (!ok) return

    await remove.mutateAsync(item.id)
    notify.success('Entry deleted')
    navigate(PATHS.activityFeed)
  }

  return (
    <DetailPage
      title={item?.type ?? 'Loading…'}
      subtitle={item?.message}
      isLoading={isLoading}
      backTo={PATHS.activityFeed}
      backLabel="Back to activity feed"
      meta={
        item
          ? [{ label: 'Created', value: item.createdAt ? formatDateTime(item.createdAt) : '—' }]
          : undefined
      }
      actions={
        item && (
          <>
            {canUpdate && (
              <Button asChild variant="outline" size="sm">
                <Link to={route(PATHS.activityFeed, item.id, 'edit')}>
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
                    { label: 'ID', value: item?.id },
                    { label: 'Type', value: item?.type },
                    { label: 'Message', value: item?.message, full: true },
                    {
                      label: 'Created',
                      value: item?.createdAt ? formatDateTime(item.createdAt) : undefined,
                    },
                    {
                      label: 'Updated',
                      value: item?.updatedAt ? formatDateTime(item.updatedAt) : undefined,
                    },
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

export default ActivityFeedDetailPage
