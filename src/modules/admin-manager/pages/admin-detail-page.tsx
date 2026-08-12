import { useState } from 'react'
import { Ban, CheckCircle2, History, Info, Pencil, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { Modal } from '@/components/common/modal'
import { PageContainer } from '@/components/common/page-container'
import { DescriptionList, DetailPage, StatusBadge, Timeline } from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useConfirm } from '@/hooks/use-confirm'
import { PATHS, route } from '@/router/paths'
import { formatDate, formatRelativeTime } from '@/utils/format'
import { notify } from '@/utils/toast'
import {
  admins,
  useAssignRoles,
  useRoleOptions,
  useSetAdminStatus,
} from '../services/admin.queries'
import { ADMIN_STATUS, adminFullName } from '../types'

export function AdminDetailPage() {
  const { adminId } = useParams<{ adminId: string }>()
  const confirm = useConfirm()

  const { data: admin, isLoading, isError } = admins.useDetail(adminId)
  const { options: roleOptions } = useRoleOptions()
  const setStatus = useSetAdminStatus()
  const assignRoles = useAssignRoles()

  const [isRoleModalOpen, setRoleModalOpen] = useState(false)
  const [draftRoles, setDraftRoles] = useState<string[]>([])

  if (isError || (!isLoading && !admin)) {
    return (
      <PageContainer>
        <EmptyState
          title="Administrator not found"
          description="They may have been removed, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={PATHS.adminManager}>Back to administrators</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const name = admin ? adminFullName(admin) : 'Loading…'
  const isSuspended = admin?.status === 'SUSPENDED'
  const roleName = (id: string): string =>
    roleOptions.find((option) => String(option.value) === id)?.label ?? id

  const toggleStatus = async (): Promise<void> => {
    if (!admin) return

    const next = isSuspended ? 'ACTIVE' : 'SUSPENDED'
    if (next === 'SUSPENDED') {
      const ok = await confirm({
        title: `Suspend ${name}?`,
        description: 'They lose access to the panel immediately.',
        confirmLabel: 'Suspend',
        tone: 'destructive',
      })
      if (!ok) return
    }

    await setStatus.mutateAsync({ id: admin.id, status: next })
    notify.success(next === 'ACTIVE' ? `${name} activated` : `${name} suspended`)
  }

  const openRoleModal = (): void => {
    setDraftRoles(admin?.roles ?? [])
    setRoleModalOpen(true)
  }

  const saveRoles = async (): Promise<void> => {
    if (!admin) return

    await assignRoles.mutateAsync({ id: admin.id, roles: draftRoles })
    setRoleModalOpen(false)
    notify.success('Roles updated')
  }

  return (
    <>
      <DetailPage
        title={name}
        subtitle={admin?.email}
        showAvatar
        isLoading={isLoading}
        backTo={PATHS.adminManager}
        backLabel="Back to administrators"
        status={admin && <StatusBadge status={admin.status} map={ADMIN_STATUS} />}
        meta={
          admin
            ? [
                { label: 'Roles', value: admin.roles.map(roleName).join(', ') || 'None' },
                {
                  label: 'Last seen',
                  value: admin.lastLoginAt ? formatRelativeTime(admin.lastLoginAt) : 'Never',
                },
                { label: 'Added', value: admin.createdAt ? formatDate(admin.createdAt) : '—' },
              ]
            : undefined
        }
        actions={
          admin && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to={route(PATHS.adminManager, admin.id, 'edit')}>
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
                      { label: 'First name', value: admin?.firstName },
                      { label: 'Last name', value: admin?.lastName },
                      { label: 'Email', value: admin?.email },
                      {
                        label: 'Status',
                        value: admin && (
                          <StatusBadge status={admin.status} map={ADMIN_STATUS} />
                        ),
                      },
                      { label: 'Administrator ID', value: admin?.id },
                      {
                        label: 'Last sign-in',
                        value: admin?.lastLoginAt
                          ? formatRelativeTime(admin.lastLoginAt)
                          : 'Never',
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            ),
          },
          {
            id: 'roles',
            label: 'Roles',
            icon: ShieldCheck,
            badge: admin?.roles.length,
            content: (
              <Card>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-body text-muted-foreground">
                      Roles decide which parts of the panel this administrator can reach.
                    </p>
                    <Button variant="outline" size="sm" onClick={openRoleModal}>
                      <Pencil className="size-4" />
                      Change roles
                    </Button>
                  </div>

                  {admin?.roles.length ? (
                    <ul className="flex flex-col gap-2">
                      {admin.roles.map((id) => (
                        <li
                          key={id}
                          className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
                        >
                          <ShieldCheck
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span className="font-medium">{roleName(id)}</span>
                          <Badge variant="outline" className="ml-auto font-mono">
                            {id}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      title="No roles assigned"
                      description="This administrator can sign in but reach nothing."
                      className="border-none"
                    />
                  )}
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
                      admin
                        ? [
                            ...(admin.lastLoginAt
                              ? [
                                  {
                                    id: 'signin',
                                    title: 'Signed in',
                                    timestamp: admin.lastLoginAt,
                                    tone: 'info' as const,
                                  },
                                ]
                              : []),
                            ...(admin.createdAt
                              ? [
                                  {
                                    id: 'created',
                                    title: 'Account created',
                                    timestamp: admin.createdAt,
                                    tone: 'success' as const,
                                  },
                                ]
                              : []),
                          ]
                        : []
                    }
                  />
                </CardContent>
              </Card>
            ),
          },
        ]}
      />

      {/* Role assignment is a modal rather than an edit-screen round trip: it is
          the change most often made on its own, and the one most often revisited. */}
      <Modal
        open={isRoleModalOpen}
        onOpenChange={setRoleModalOpen}
        title="Change roles"
        description={`Choose which roles ${name} holds.`}
        dismissible={!assignRoles.isPending}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setRoleModalOpen(false)}
              disabled={assignRoles.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void saveRoles()}
              disabled={assignRoles.isPending || draftRoles.length === 0}
            >
              {assignRoles.isPending && <Spinner size="sm" />}
              Save roles
            </Button>
          </>
        }
      >
        <ul className="flex flex-col gap-1">
          {roleOptions.map((option) => {
            const id = String(option.value)
            const checked = draftRoles.includes(id)

            return (
              <li key={id}>
                <Label
                  htmlFor={`role-${id}`}
                  className="flex cursor-pointer items-start gap-2.5 rounded-md p-2 font-normal hover:bg-accent"
                >
                  <Checkbox
                    id={`role-${id}`}
                    checked={checked}
                    onCheckedChange={() =>
                      setDraftRoles((previous) =>
                        checked ? previous.filter((r) => r !== id) : [...previous, id],
                      )
                    }
                    className="mt-0.5"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">{option.label}</span>
                    {option.description && (
                      <span className="text-caption text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                </Label>
              </li>
            )
          })}
        </ul>

        {draftRoles.length === 0 && (
          <p className="mt-2 text-caption text-destructive">
            Assign at least one role, or this administrator can reach nothing.
          </p>
        )}
      </Modal>
    </>
  )
}

export default AdminDetailPage
