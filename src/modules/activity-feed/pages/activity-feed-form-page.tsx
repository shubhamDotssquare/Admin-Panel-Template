import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { FormPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'
import { notify } from '@/utils/toast'
import { ActivityFeedForm } from '../components/activity-feed-form'
import { activityFeed } from '../services/activity-feed.queries'

/**
 * Create and edit, in one screen.
 *
 * The route decides which: `/activity-feed/new` has no `:itemId`,
 * `/activity-feed/:id/edit` does. Both render the same `ActivityFeedForm`, so
 * the two paths cannot drift.
 */
export function ActivityFeedFormPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(itemId)
  const { data: item, isLoading, isError } = activityFeed.useDetail(itemId)

  const create = activityFeed.useCreate()
  const update = activityFeed.useUpdate()

  const backTo = isEdit && itemId ? route(PATHS.activityFeed, itemId) : PATHS.activityFeed

  return (
    <FormPage
      title={isEdit ? 'Edit entry' : 'New entry'}
      description={
        isEdit ? 'Update this activity feed entry.' : 'Add a new entry to the activity feed.'
      }
      backTo={backTo}
      backLabel={isEdit ? 'Back to entry' : 'Back to activity feed'}
      isLoading={isEdit && isLoading}
      error={
        isError && (
          <EmptyState
            title="Entry not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={PATHS.activityFeed}>Back to activity feed</Link>
              </Button>
            }
          />
        )
      }
    >
      <ActivityFeedForm
        item={item}
        onCancel={() => navigate(backTo)}
        onSubmit={async (values) => {
          if (isEdit && itemId) {
            await update.mutateAsync({ id: itemId, payload: values })
            notify.success('Entry updated')
            navigate(route(PATHS.activityFeed, itemId))
            return
          }

          const created = await create.mutateAsync(values)
          notify.success('Entry created')
          navigate(route(PATHS.activityFeed, created.id))
        }}
      />
    </FormPage>
  )
}

export default ActivityFeedFormPage
