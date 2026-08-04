import { useEffect, useState } from 'react'

import { DEBOUNCE_MS } from '@/constants/ui'

/** Returns `value` after it has stopped changing for `delay` ms. */
export function useDebouncedValue<T>(value: T, delay: number = DEBOUNCE_MS.search): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timeoutId)
  }, [value, delay])

  return debounced
}
