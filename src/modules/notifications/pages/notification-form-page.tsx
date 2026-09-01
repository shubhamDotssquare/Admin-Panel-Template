import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { FormPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'
import { notify } from '@/utils/toast'
import { NotificationForm } from '../components/notification-form'
import { notifications } from '../services/notification.queries'

/**
 * Create and edit, in one screen.
 *
 * The route decides which: `/notifications/new` has no `:notificationId`,
 * `/notifications/:id/edit` does. Both render the same `NotificationForm`, so
 * the two paths cannot drift.
 */
export function NotificationFormPage() {
  const { notificationId } = useParams<{ notificationId: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(notificationId)
  const { data: notification, isLoading, isError } = notifications.useDetail(notificationId)

  const create = notifications.useCreate()
  const update = notifications.useUpdate()

  const backTo =
    isEdit && notificationId ? route(PATHS.notifications, notificationId) : PATHS.notifications

  return (
    <FormPage
      title={isEdit ? `Edit ${notification?.title ?? 'notification'}` : 'Add notification'}
      description={
        isEdit
          ? 'Update this notification’s content and recipient.'
          : 'Send a notification to one admin, or broadcast to all of them.'
      }
      backTo={backTo}
      backLabel={isEdit ? 'Back to notification' : 'Back to notifications'}
      isLoading={isEdit && isLoading}
      error={
        isError && (
          <EmptyState
            title="Notification not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={PATHS.notifications}>Back to notifications</Link>
              </Button>
            }
          />
        )
      }
    >
      <NotificationForm
        notification={notification}
        onCancel={() => navigate(backTo)}
        onSubmit={async (values) => {
          if (isEdit && notificationId) {
            await update.mutateAsync({ id: notificationId, payload: values })
            notify.success('Notification updated')
            navigate(route(PATHS.notifications, notificationId))
            return
          }

          const created = await create.mutateAsync(values)
          notify.success('Notification created')
          navigate(route(PATHS.notifications, created.id))
        }}
      />
    </FormPage>
  )
}

export default NotificationFormPage
