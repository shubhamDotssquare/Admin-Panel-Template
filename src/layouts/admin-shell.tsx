import { AdminLayout } from '@/layouts/admin-layout'
import { useAuth } from '@/hooks/use-auth'
import { displayName } from '@/utils/user'

/**
 * The seam between auth state and the generic shell.
 *
 * `AdminLayout` takes the signed-in user as a prop so it stays reusable and free
 * of auth imports. This is the one component that reads `useAuth()` and feeds
 * it, which is what the route tree mounts.
 */
export function AdminShell() {
  const { user, signOut } = useAuth()

  return (
    <AdminLayout
      user={
        user
          ? {
              name: displayName(user),
              email: user.email,
              avatarUrl: user.avatarUrl ?? undefined,
            }
          : undefined
      }
      onSignOut={() => void signOut()}
    />
  )
}

export default AdminShell
