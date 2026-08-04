import { useCallback, useMemo, useState } from 'react'

export interface Disclosure {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setOpen: (open: boolean) => void
}

/** Open/closed state for dialogs, sheets and collapsible sections. */
export function useDisclosure(initialOpen = false): Disclosure {
  const [isOpen, setOpen] = useState(initialOpen)

  const open = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((previous) => !previous), [])

  return useMemo(
    () => ({ isOpen, open, close, toggle, setOpen }),
    [isOpen, open, close, toggle],
  )
}
