import { useCallback, useEffect, useState } from 'react'

import { getStorageItem, setStorageItem } from '@/utils/storage'

/**
 * `useState` backed by localStorage, synced across tabs.
 *
 * Always pass a key from `@/constants/storage-keys`.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((previous: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => getStorageItem(key, initialValue))

  const update = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const resolved = next instanceof Function ? next(previous) : next
        setStorageItem(key, resolved)
        return resolved
      })
    },
    [key],
  )

  // Keep other tabs in step.
  useEffect(() => {
    const handleStorage = (event: StorageEvent): void => {
      if (event.key !== key || event.newValue === null) return

      try {
        setValue(JSON.parse(event.newValue) as T)
      } catch {
        // Ignore values this tab cannot parse.
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key])

  return [value, update]
}
