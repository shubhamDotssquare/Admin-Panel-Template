import { createContext, useCallback, useMemo, useRef, useState } from 'react'

import { ConfirmDialog, type ConfirmOptions } from '@/components/common/confirm-dialog'

export interface ConfirmContextValue {
  /** Resolves true when confirmed, false when cancelled or dismissed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

export const ConfirmContext = createContext<ConfirmContextValue | null>(null)

/**
 * Hosts one shared confirmation dialog and hands out a promise-based `confirm()`.
 *
 * The alternative — local `isOpen` state plus a `<ConfirmDialog>` in every screen
 * that deletes something — is the same six lines repeated per call site. Here the
 * dialog is mounted once and the await reads like the question being asked:
 *
 * ```ts
 * if (!(await confirm({ title: 'Delete user?', tone: 'destructive' }))) return
 * ```
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)

  // Held in a ref because the pending promise must outlive re-renders, and
  // resolving it is a side effect that should never itself trigger one.
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null)

  const settle = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed)
    resolveRef.current = null
    setOptions(null)
  }, [])

  const confirm = useCallback((next: ConfirmOptions) => {
    // A second request while one is open would orphan the first promise, so
    // the earlier question is answered "no" before this one replaces it.
    resolveRef.current?.(false)

    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      {options && (
        <ConfirmDialog
          {...options}
          open
          onOpenChange={(open) => {
            if (!open) settle(false)
          }}
          onConfirm={() => settle(true)}
        />
      )}
    </ConfirmContext.Provider>
  )
}
