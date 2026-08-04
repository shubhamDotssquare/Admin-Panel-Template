/** Shared UI defaults — pagination, debounce timings, breakpoints. */

export const PAGINATION = {
  defaultPage: 1,
  defaultPerPage: 10,
  perPageOptions: [10, 25, 50, 100],
} as const

export const DEBOUNCE_MS = {
  search: 300,
  input: 200,
  resize: 100,
} as const

export const TOAST_DURATION_MS = 4000

/**
 * Mirrors Tailwind's default breakpoints so `useMediaQuery` and the layout
 * agree on where "mobile" ends.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const MEDIA_QUERIES = {
  /** Below `lg` the sidebar becomes an off-canvas sheet. */
  mobileNav: `(max-width: ${BREAKPOINTS.lg - 1}px)`,
  prefersDark: '(prefers-color-scheme: dark)',
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
} as const

export const DATE_FORMATS = {
  date: 'medium',
  dateTime: 'short',
} as const
