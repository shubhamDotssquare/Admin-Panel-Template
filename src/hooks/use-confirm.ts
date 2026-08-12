import { useContext } from 'react'

import type { ConfirmOptions } from '@/components/common/confirm-dialog'
import { ConfirmContext } from '@/providers/confirm-provider'

/**
 * Ask the user to confirm an action, and await their answer.
 *
 * ```ts
 * const confirm = useConfirm()
 *
 * async function handleDelete(user: User) {
 *   const ok = await confirm({
 *     title: `Delete ${user.name}?`,
 *     description: 'This cannot be undone.',
 *     confirmLabel: 'Delete',
 *     tone: 'destructive',
 *   })
 *   if (!ok) return
 *
 *   notify.promise(userService.remove(user.id), {
 *     loading: 'Deleting…',
 *     success: 'User deleted',
 *   })
 * }
 * ```
 *
 * Must be used under `ConfirmProvider`.
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const context = useContext(ConfirmContext)

  if (!context) {
    throw new Error('useConfirm must be used within a <ConfirmProvider>.')
  }

  return context.confirm
}
