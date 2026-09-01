import { Ban, Braces, CheckCircle2, Info, Pencil, Power } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { DescriptionList, DetailPage, StatusBadge } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirm } from '@/hooks/use-confirm'
import { usePermission } from '@/hooks/use-permission'
import { PATHS, route } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import { formatDate, formatRelativeTime } from '@/utils/format'
import { notify } from '@/utils/toast'
import { users, useUserLifecycle } from '../services/user.queries'
import { USER_STATUS, userFullName } from '../types'

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const confirm = useConfirm()

  const { data: user, isLoading, isError } = users.useDetail(userId)
  const lifecycle = useUserLifecycle()
  const canUpdate = usePermission(PERMISSIONS.usersUpdate)

  if (isError || (!isLoading && !user)) {
    return (
      <PageContainer>
        <EmptyState
          title="User not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={PATHS.userManager}>Back to users</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const name = user ? userFullName(user) : 'Loading…'

  const run = async (
    action: 'activate' | 'deactivate' | 'suspend',
    confirmation?: { title: string; description?: string },
  ): Promise<void> => {
    if (!user) return

    if (confirmation) {
      const ok = await confirm({
        ...confirmation,
        confirmLabel: 'Confirm',
        tone: 'destructive',
      })
      if (!ok) return
    }

    await lifecycle.mutateAsync({ id: user.id, action })
    notify.success(`${name} ${action}d`)
  }

  const metadataEntries = Object.entries(user?.metadata ?? {})

  return (
    <DetailPage
      title={name}
      subtitle={user?.email}
      showAvatar
      isLoading={isLoading}
      backTo={PATHS.userManager}
      backLabel="Back to users"
      status={user && <StatusBadge status={user.status} map={USER_STATUS} />}
      meta={
        user
          ? [
              { label: 'Phone', value: user.phone || '—' },
              {
                label: 'Last seen',
                value: user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never',
              },
              { label: 'Created', value: user.createdAt ? formatDate(user.createdAt) : '—' },
            ]
          : undefined
      }
      actions={
        user &&
        canUpdate && (
          <>
            <Button asChild variant="outline" size="sm">
              <Link to={route(PATHS.userManager, user.id, 'edit')}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>

            {user.status !== 'ACTIVE' && (
              <Button
                size="sm"
                disabled={lifecycle.isPending}
                onClick={() => void run('activate')}
              >
                <CheckCircle2 className="size-4" />
                Activate
              </Button>
            )}

            {user.status !== 'INACTIVE' && (
              <Button
                variant="outline"
                size="sm"
                disabled={lifecycle.isPending}
                onClick={() => void run('deactivate', { title: `Deactivate ${name}?` })}
              >
                <Power className="size-4" />
                Deactivate
              </Button>
            )}

            {user.status !== 'SUSPENDED' && (
              <Button
                variant="destructive"
                size="sm"
                disabled={lifecycle.isPending}
                onClick={() => void run('suspend', { title: `Suspend ${name}?` })}
              >
                <Ban className="size-4" />
                Suspend
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
                    { label: 'First name', value: user?.firstName },
                    { label: 'Last name', value: user?.lastName },
                    { label: 'Email', value: user?.email },
                    { label: 'Phone', value: user?.phone },
                    {
                      label: 'Status',
                      value: user && <StatusBadge status={user.status} map={USER_STATUS} />,
                    },
                    {
                      label: 'Email verified',
                      value: user?.emailVerified ? 'Verified' : 'Not verified',
                    },
                    { label: 'Last sign-in IP', value: user?.lastLoginIp },
                    { label: 'User ID', value: user?.id },
                  ]}
                />
              </CardContent>
            </Card>
          ),
        },
        {
          id: 'metadata',
          label: 'Metadata',
          icon: Braces,
          badge: metadataEntries.length || undefined,
          content: (
            <Card>
              <CardContent className="flex flex-col gap-3">
                {metadataEntries.length === 0 ? (
                  <EmptyState
                    icon={Braces}
                    title="No metadata"
                    description="Add free-form JSON from the edit screen."
                    className="border-none"
                  />
                ) : (
                  <>
                    <DescriptionList
                      items={metadataEntries.map(([key, value]) => ({
                        label: key,
                        value:
                          typeof value === 'object' && value !== null ? (
                            <code className="font-mono text-caption">
                              {JSON.stringify(value)}
                            </code>
                          ) : (
                            String(value)
                          ),
                      }))}
                    />
                    <p className="text-caption text-muted-foreground">
                      Editing replaces this object wholesale — the edit form loads the current
                      value so nothing is lost.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ),
        },
      ]}
    />
  )
}

export default UserDetailPage
