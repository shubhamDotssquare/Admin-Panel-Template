import { useEffect, useState } from 'react'

import { MEDIA_QUERIES } from '@/constants/ui'

/** Subscribe to a CSS media query. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent): void => setMatches(event.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

/** True below the `lg` breakpoint, where the sidebar becomes a drawer. */
export function useIsMobile(): boolean {
  return useMediaQuery(MEDIA_QUERIES.mobileNav)
}
