import { Activity, Ban, CheckCircle2, History, Info, Pencil, StickyNote } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import {
  DescriptionList,
  DetailPage,
  NoteList,
  StatusBadge,
  Timeline,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirm } from '@/hooks/use-confirm'
import { PATHS, route } from '@/router/paths'
import { formatDate, formatDateTime, formatRelativeTime } from '@/utils/format'
import { notify } from '@/utils/toast'
import { users, useSetUserStatus } from '../services/user.queries'
import { USER_STATUS, userFullName } from '../types'

/**
 * A user's profile.
 *
 * Every section is a framework pattern — the module supplies data and decides
 * which tabs a user record has, and owns no layout of its own.
 */
export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const confirm = useConfirm()

  const { data: user, isLoading, isError } = users.useDetail(userId)
  const setStatus = useSetUserStatus()

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
  const isSuspended = user?.status === 'SUSPENDED'

  const toggleStatus = async (): Promise<void> => {
    if (!user) return

    const next = isSuspended ? 'ACTIVE' : 'SUSPENDED'
    if (next === 'SUSPENDED') {
      const ok = await confirm({
        title: `Suspend ${name}?`,
        description: 'They will be signed out and blocked from signing in again.',
        confirmLabel: 'Suspend',
        tone: 'destructive',
      })
      if (!ok) return
    }

    await setStatus.mutateAsync({ id: user.id, status: next })
    notify.success(next === 'ACTIVE' ? `${name} activated` : `${name} suspended`)
  }

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
              { label: 'Groups', value: user.groups?.join(', ') || '—' },
              {
                label: 'Last seen',
                value: user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never',
              },
              { label: 'Joined', value: user.createdAt ? formatDate(user.createdAt) : '—' },
            ]
          : undefined
      }
      actions={
        user && (
          <>
            <Button asChild variant="outline" size="sm">
              <Link to={route(PATHS.userManager, user.id, 'edit')}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>

            <Button
              variant={isSuspended ? 'default' : 'destructive'}
              size="sm"
              disabled={setStatus.isPending}
              onClick={() => void toggleStatus()}
            >
              {isSuspended ? <CheckCircle2 className="size-4" /> : <Ban className="size-4" />}
              {isSuspended ? 'Activate' : 'Suspend'}
            </Button>
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
                    { label: 'Groups', value: user?.groups?.join(', ') || '—' },
                    { label: 'User ID', value: user?.id },
                    { label: 'Internal notes', full: true, value: user?.notes },
                  ]}
                />
              </CardContent>
            </Card>
          ),
        },
        {
          id: 'activity',
          label: 'Activity',
          icon: Activity,
          content: (
            <Card>
              <CardContent>
                <Timeline
                  isLoading={isLoading}
                  // Real activity arrives when an events endpoint exists; the
                  // record's own timestamps are what the API gives us today.
                  events={
                    user
                      ? [
                          ...(user.lastLoginAt
                            ? [
                                {
                                  id: 'last-login',
                                  title: 'Signed in',
                                  timestamp: user.lastLoginAt,
                                  tone: 'info' as const,
                                },
                              ]
                            : []),
                          ...(user.createdAt
                            ? [
                                {
                                  id: 'created',
                                  title: 'Account created',
                                  timestamp: user.createdAt,
                                  tone: 'success' as const,
                                },
                              ]
                            : []),
                        ]
                      : []
                  }
                  emptyTitle="No activity recorded"
                  emptyDescription="Sign-ins and changes will appear here."
                />
              </CardContent>
            </Card>
          ),
        },
        {
          id: 'notes',
          label: 'Notes',
          icon: StickyNote,
          content: (
            <Card>
              <CardContent>
                <NoteList
                  isLoading={isLoading}
                  notes={
                    user?.notes
                      ? [
                          {
                            id: 'note',
                            body: user.notes,
                            author: 'Internal',
                            createdAt: user.createdAt,
                          },
                        ]
                      : []
                  }
                  emptyTitle="No notes"
                  emptyDescription="Add notes from the edit screen until a notes endpoint exists."
                />
              </CardContent>
            </Card>
          ),
        },
        {
          id: 'history',
          label: 'History',
          icon: History,
          content: (
            <Card>
              <CardContent>
                <Timeline
                  isLoading={isLoading}
                  events={
                    user?.createdAt
                      ? [
                          {
                            id: 'created',
                            title: 'Record created',
                            timestamp: user.createdAt,
                            description: formatDateTime(user.createdAt),
                            tone: 'success',
                          },
                        ]
                      : []
                  }
                  emptyTitle="No changes recorded"
                  emptyDescription="Edits will be listed here once auditing is enabled."
                />
              </CardContent>
            </Card>
          ),
        },
      ]}
    />
  )
}

export default UserDetailPage
