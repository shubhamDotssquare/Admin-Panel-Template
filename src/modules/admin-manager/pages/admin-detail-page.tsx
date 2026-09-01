import { useState } from 'react'
import { Ban, CheckCircle2, Info, Pencil, Power, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { DescriptionList, DetailPage, StatusBadge } from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useConfirm } from '@/hooks/use-confirm'
import { usePermission } from '@/hooks/use-permission'
import { PATHS, route } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import { formatDate, formatRelativeTime } from '@/utils/format'
import { notify } from '@/utils/toast'
import { AdminRolesPanel } from '../components/admin-roles-panel'
import { admins, useAdminLifecycle } from '../services/admin.queries'
import { ADMIN_ROLE_LABELS, ADMIN_STATUS, adminFullName } from '../types'

export function AdminDetailPage() {
  const { adminId } = useParams<{ adminId: string }>()
  const { user } = useAuth()
  const confirm = useConfirm()

  const { data: admin, isLoading, isError } = admins.useDetail(adminId)
  const lifecycle = useAdminLifecycle()

  const canUpdate = usePermission(PERMISSIONS.adminsUpdate)
  const canReadRoles = usePermission(PERMISSIONS.rolesRead)

  const [isRolesOpen, setRolesOpen] = useState(false)

  if (isError || (!isLoading && !admin)) {
    return (
      <PageContainer>
        <EmptyState
          title="Administrator not found"
          description="They may have been deleted, or the link is wrong."
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
  // The API refuses these on your own account; do not offer them.
  const isSelf = Boolean(admin && user?.id && admin.id === user.id)

  const run = async (
    action: 'activate' | 'deactivate' | 'suspend',
    confirmation?: { title: string; description: string },
  ): Promise<void> => {
    if (!admin) return

    if (confirmation) {
      const ok = await confirm({
        ...confirmation,
        confirmLabel: 'Confirm',
        tone: 'destructive',
      })
      if (!ok) return
    }

    await lifecycle.mutateAsync({ id: admin.id, action })
    notify.success(`${name} ${action}d`)
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
                { label: 'Role tier', value: ADMIN_ROLE_LABELS[admin.role] ?? admin.role },
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
              {canReadRoles && (
                <Button variant="outline" size="sm" onClick={() => setRolesOpen(true)}>
                  <ShieldCheck className="size-4" />
                  Manage roles
                </Button>
              )}

              {canUpdate && (
                <Button asChild variant="outline" size="sm">
                  <Link to={route(PATHS.adminManager, admin.id, 'edit')}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
              )}

              {canUpdate && admin.status !== 'ACTIVE' && (
                <Button
                  size="sm"
                  disabled={lifecycle.isPending}
                  onClick={() => void run('activate')}
                >
                  <CheckCircle2 className="size-4" />
                  Activate
                </Button>
              )}

              {canUpdate && admin.status !== 'INACTIVE' && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={lifecycle.isPending || isSelf}
                  title={isSelf ? 'You cannot deactivate your own account' : undefined}
                  onClick={() =>
                    void run('deactivate', {
                      title: `Deactivate ${name}?`,
                      description: 'Their active sessions end immediately.',
                    })
                  }
                >
                  <Power className="size-4" />
                  Deactivate
                </Button>
              )}

              {canUpdate && admin.status !== 'SUSPENDED' && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={lifecycle.isPending || isSelf}
                  title={isSelf ? 'You cannot suspend your own account' : undefined}
                  onClick={() =>
                    void run('suspend', {
                      title: `Suspend ${name}?`,
                      description: 'Their active sessions end immediately.',
                    })
                  }
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
                      { label: 'First name', value: admin?.firstName },
                      { label: 'Last name', value: admin?.lastName },
                      { label: 'Email', value: admin?.email },
                      { label: 'Username', value: admin?.username },
                      { label: 'Phone', value: admin?.phone },
                      {
                        label: 'Role tier',
                        value: admin && (
                          <Badge variant="secondary">
                            {ADMIN_ROLE_LABELS[admin.role] ?? admin.role}
                          </Badge>
                        ),
                      },
                      {
                        label: 'Status',
                        value: admin && (
                          <StatusBadge status={admin.status} map={ADMIN_STATUS} />
                        ),
                      },
                      {
                        label: 'Email verified',
                        value: admin?.emailVerified ? 'Verified' : 'Not verified',
                      },
                      { label: 'Last sign-in IP', value: admin?.lastLoginIp },
                      { label: 'Admin ID', value: admin?.id },
                    ]}
                  />
                </CardContent>
              </Card>
            ),
          },
          ...(canReadRoles && admin
            ? [
                {
                  id: 'roles',
                  label: 'Roles',
                  icon: ShieldCheck,
                  content: <AdminRolesPanel adminId={admin.id} adminName={name} />,
                },
              ]
            : []),
        ]}
      />

      {admin && canReadRoles && (
        <AdminRolesPanel
          adminId={admin.id}
          adminName={name}
          asModal
          open={isRolesOpen}
          onOpenChange={setRolesOpen}
        />
      )}
    </>
  )
}

export default AdminDetailPage
