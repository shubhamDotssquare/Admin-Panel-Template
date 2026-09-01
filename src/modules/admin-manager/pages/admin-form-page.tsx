import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { FormPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'
import { notify } from '@/utils/toast'
import { AdminForm } from '../components/admin-form'
import { admins } from '../services/admin.queries'
import { adminFullName, type CreateAdminDto, type UpdateAdminDto } from '../types'

/** Create and edit an administrator, sharing one form. */
export function AdminFormPage() {
  const { adminId } = useParams<{ adminId: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(adminId)
  const { data: admin, isLoading, isError } = admins.useDetail(adminId)

  const create = admins.useCreate()
  const update = admins.useUpdate()

  const backTo = isEdit && adminId ? route(PATHS.adminManager, adminId) : PATHS.adminManager

  return (
    <FormPage
      title={
        isEdit
          ? `Edit ${admin ? adminFullName(admin) : 'administrator'}`
          : 'Invite administrator'
      }
      description={
        isEdit
          ? 'Update this account. Passwords are changed elsewhere.'
          : 'Create the account, then assign roles from its profile.'
      }
      backTo={backTo}
      backLabel={isEdit ? 'Back to profile' : 'Back to administrators'}
      isLoading={isEdit && isLoading}
      error={
        isError && (
          <EmptyState
            title="Administrator not found"
            description="They may have been removed, or the link is wrong."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={PATHS.adminManager}>Back to administrators</Link>
              </Button>
            }
          />
        )
      }
    >
      <AdminForm
        admin={admin}
        onCancel={() => navigate(backTo)}
        onSubmit={async (values) => {
          if (isEdit && adminId) {
            // The edit schema omits `password`; the API rejects it here anyway.
            await update.mutateAsync({ id: adminId, payload: values as UpdateAdminDto })
            notify.success('Administrator updated')
            navigate(route(PATHS.adminManager, adminId))
            return
          }

          const created = await create.mutateAsync(values as CreateAdminDto)
          notify.success('Administrator created')
          navigate(route(PATHS.adminManager, created.id))
        }}
      />
    </FormPage>
  )
}

export default AdminFormPage
