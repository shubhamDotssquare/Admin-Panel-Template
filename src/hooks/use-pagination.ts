import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { PAGINATION } from '@/constants/ui'

export interface UsePaginationOptions {
  initialPage?: number
  initialPerPage?: number
  /**
   * Total record count from the server, once known. Supplying it enables
   * `totalPages`, `canNext` and clamping.
   */
  total?: number
  /**
   * Mirror page and size in the URL, so a list view is shareable, bookmarkable
   * and survives the back button. Recommended for route-level tables.
   */
  syncToUrl?: boolean
  /** Query-param names, when `syncToUrl` is on. */
  pageParam?: string
  perPageParam?: string
}

export interface UsePaginationResult {
  page: number
  perPage: number
  setPage: (page: number) => void
  /** Changing size returns to page 1 — the old offset would be meaningless. */
  setPerPage: (perPage: number) => void
  next: () => void
  previous: () => void
  reset: () => void
  canPrevious: boolean
  /** False once `total` says there is nothing beyond this page. */
  canNext: boolean
  totalPages: number
  /** Zero-based offset, for APIs that take skip/limit instead of page/size. */
  offset: number
  /** Human range for "Showing 11–20 of 57". */
  range: { from: number; to: number }
  /** Ready to spread into a list request. */
  params: { page: number; perPage: number }
}

function toPositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Page/size state for list screens.
 *
 * Pairs with `createResourceQueries`, whose `useList` keeps the previous page
 * rendered while the next loads:
 *
 * ```tsx
 * const pagination = usePagination({ syncToUrl: true })
 * const { data } = users.useList(pagination.params)
 * // …then feed `data.meta.total` back in for totalPages and canNext.
 * const { totalPages } = usePagination({ total: data?.meta.total })
 * ```
 *
 * URL sync is opt-in rather than default because the hook is also useful inside
 * dialogs and drawers, where writing to the address bar would be wrong.
 */
export function usePagination({
  initialPage = PAGINATION.defaultPage,
  initialPerPage = PAGINATION.defaultPerPage,
  total,
  syncToUrl = false,
  pageParam = 'page',
  perPageParam = 'perPage',
}: UsePaginationOptions = {}): UsePaginationResult {
  // Both stores are always created: hooks cannot be called conditionally, and
  // `useSearchParams` is inert until something actually writes to it.
  const [searchParams, setSearchParams] = useSearchParams()
  const [localPage, setLocalPage] = useState(initialPage)
  const [localPerPage, setLocalPerPage] = useState(initialPerPage)

  const page = syncToUrl ? toPositiveInt(searchParams.get(pageParam), initialPage) : localPage
  const perPage = syncToUrl
    ? toPositiveInt(searchParams.get(perPageParam), initialPerPage)
    : localPerPage

  const totalPages = useMemo(() => {
    if (total === undefined || total <= 0) return 0
    return Math.max(1, Math.ceil(total / perPage))
  }, [perPage, total])

  const commit = useCallback(
    (nextPage: number, nextPerPage: number) => {
      // Clamp only once the server has told us how many pages exist; before
      // that an upper bound would be a guess.
      const maxPage =
        total === undefined ? nextPage : Math.max(1, Math.ceil(total / nextPerPage))
      const safePage = Math.min(Math.max(1, nextPage), Math.max(1, maxPage))

      if (!syncToUrl) {
        setLocalPage(safePage)
        setLocalPerPage(nextPerPage)
        return
      }

      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          next.set(pageParam, String(safePage))
          next.set(perPageParam, String(nextPerPage))
          return next
        },
        // Paging is navigation within one screen, not a new destination —
        // `replace` keeps the back button meaning "the previous screen".
        { replace: true },
      )
    },
    [pageParam, perPageParam, setSearchParams, syncToUrl, total],
  )

  const setPage = useCallback((next: number) => commit(next, perPage), [commit, perPage])

  const setPerPage = useCallback((next: number) => commit(1, next), [commit])

  const next = useCallback(() => commit(page + 1, perPage), [commit, page, perPage])
  const previous = useCallback(() => commit(page - 1, perPage), [commit, page, perPage])
  const reset = useCallback(
    () => commit(initialPage, initialPerPage),
    [commit, initialPage, initialPerPage],
  )

  const offset = (page - 1) * perPage

  return {
    page,
    perPage,
    setPage,
    setPerPage,
    next,
    previous,
    reset,
    canPrevious: page > 1,
    // Unknown total means the caller cannot yet prove there is no next page.
    canNext: total === undefined ? true : page < totalPages,
    totalPages,
    offset,
    range: {
      from: total === 0 ? 0 : offset + 1,
      to: total === undefined ? offset + perPage : Math.min(offset + perPage, total),
    },
    params: { page, perPage },
  }
}
