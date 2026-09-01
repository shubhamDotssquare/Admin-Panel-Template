import { CheckCheck, Info, Pencil } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { Badge } from '@/components/ui/badge'
import { DescriptionList, DetailPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePermission } from '@/hooks/use-permission'
import { PATHS, route } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import { formatDate } from '@/utils/format'
import { notify } from '@/utils/toast'
import { notifications, useMarkNotificationRead } from '../services/notification.queries'

export function NotificationDetailPage() {
  const { notificationId } = useParams<{ notificationId: string }>()

  const { data: notification, isLoading, isError } = notifications.useDetail(notificationId)
  const markRead = useMarkNotificationRead()
  const canUpdate = usePermission(PERMISSIONS.notificationsUpdate)

  if (isError || (!isLoading && !notification)) {
    return (
      <PageContainer>
        <EmptyState
          title="Notification not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={PATHS.notifications}>Back to notifications</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  return (
    <DetailPage
      title={notification?.title ?? 'Loading…'}
      subtitle={notification?.type}
      isLoading={isLoading}
      backTo={PATHS.notifications}
      backLabel="Back to notifications"
      status={
        notification && (
          <Badge variant={notification.read ? 'outline' : 'default'}>
            {notification.read ? 'Read' : 'Unread'}
          </Badge>
        )
      }
      meta={
        notification
          ? [
              {
                label: 'Recipient',
                value: notification.recipientAdminId ?? 'Broadcast',
              },
              { label: 'Created', value: formatDate(notification.createdAt) },
            ]
          : undefined
      }
      actions={
        notification &&
        canUpdate && (
          <>
            <Button asChild variant="outline" size="sm">
              <Link to={route(PATHS.notifications, notification.id, 'edit')}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>

            {!notification.read && (
              <Button
                size="sm"
                disabled={markRead.isPending}
                onClick={async () => {
                  await markRead.mutateAsync(notification.id)
                  notify.success(`${notification.title} marked as read`)
                }}
              >
                <CheckCheck className="size-4" />
                Mark as read
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
                    { label: 'Title', value: notification?.title },
                    { label: 'Message', value: notification?.message },
                    { label: 'Type', value: notification?.type },
                    { label: 'Recipient', value: notification?.recipientAdminId ?? 'Broadcast' },
                    {
                      label: 'Read at',
                      value: notification?.readAt ? formatDate(notification.readAt) : 'Not read yet',
                    },
                    { label: 'Notification ID', value: notification?.id },
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

export default NotificationDetailPage
