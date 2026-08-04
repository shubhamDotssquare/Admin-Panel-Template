import { useEffect } from 'react'

import { appConfig } from '@/config/app.config'

/** Set `document.title` to `Page · App Name` for the lifetime of a screen. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = title
      ? `${title}${appConfig.titleSeparator}${appConfig.name}`
      : appConfig.name

    return () => {
      document.title = previous
    }
  }, [title])
}
