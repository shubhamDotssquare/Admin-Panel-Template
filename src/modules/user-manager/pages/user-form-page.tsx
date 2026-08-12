import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { FormPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'
import { notify } from '@/utils/toast'
import { UserForm } from '../components/user-form'
import { users } from '../services/user.queries'
import { userFullName } from '../types'

/**
 * Create and edit, in one screen.
 *
 * The route decides which: `/users/new` has no `:userId`, `/users/:id/edit`
 * does. Both render the same `UserForm`, so the two paths cannot drift.
 */
export function UserFormPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(userId)
  const { data: user, isLoading, isError } = users.useDetail(userId)

  const create = users.useCreate()
  const update = users.useUpdate()

  const backTo = isEdit && userId ? route(PATHS.userManager, userId) : PATHS.userManager

  return (
    <FormPage
      title={isEdit ? `Edit ${user ? userFullName(user) : 'user'}` : 'Add user'}
      description={
        isEdit
          ? 'Update this account’s details and access.'
          : 'Create an account for someone to sign in with.'
      }
      backTo={backTo}
      backLabel={isEdit ? 'Back to profile' : 'Back to users'}
      isLoading={isEdit && isLoading}
      error={
        isError && (
          <EmptyState
            title="User not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={PATHS.userManager}>Back to users</Link>
              </Button>
            }
          />
        )
      }
    >
      <UserForm
        user={user}
        onCancel={() => navigate(backTo)}
        onSubmit={async (values) => {
          if (isEdit && userId) {
            await update.mutateAsync({ id: userId, payload: values })
            notify.success('User updated')
            navigate(route(PATHS.userManager, userId))
            return
          }

          const created = await create.mutateAsync(values)
          notify.success('User created')
          // Straight to the new record: creating one is almost always followed
          // by wanting to look at it.
          navigate(route(PATHS.userManager, created.id))
        }}
      />
    </FormPage>
  )
}

export default UserFormPage
