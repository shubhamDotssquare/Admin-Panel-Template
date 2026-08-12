import { useCallback, useEffect, useMemo, useState } from 'react'

import { DEBOUNCE_MS, PAGINATION } from '@/constants/ui'
import type { SortDirection, SortState } from '@/types/common.types'
import type { ListQueryParams } from '@/types/api.types'
import type { FilterValues, TableSchema } from '@/types/table.types'
import { useDebouncedValue } from './use-debounce'
import { usePagination, type UsePaginationResult } from './use-pagination'

export interface UseTableStateOptions<TRow> {
  schema: TableSchema<TRow>
  /** Mirror page and size in the URL so a list view is shareable. */
  syncToUrl?: boolean
  /** Total from the server, once known — enables clamping and `totalPages`. */
  total?: number
}

export interface UseTableStateResult<TRow> {
  /** Raw search text, bound to the input. */
  search: string
  setSearch: (value: string) => void
  sort: SortState | null
  /** Cycles a column asc → desc → unsorted. */
  toggleSort: (field: string) => void
  filters: FilterValues
  setFilter: (id: string, value: FilterValues[string]) => void
  clearFilters: () => void
  /** Count of active filters plus search — drives the "Clear" affordance. */
  activeFilterCount: number
  pagination: UsePaginationResult
  /** Ids of selected rows, in selection order. */
  selectedIds: string[]
  isSelected: (row: TRow) => boolean
  toggleRow: (row: TRow) => void
  /** Selects or clears every row currently on screen. */
  toggleAll: (rows: TRow[]) => void
  clearSelection: () => void
  hiddenColumnIds: string[]
  isColumnVisible: (id: string) => boolean
  toggleColumn: (id: string) => void
  resetColumns: () => void
  /** Ready to hand to a list query. */
  params: ListQueryParams
}

/**
 * All the state a list screen needs, in one hook.
 *
 * Kept separate from the table component so a page can read the current query —
 * to fetch with it, or to show a filtered count — without the table having to
 * hand it back out through callbacks.
 *
 * ```ts
 * const table = useTableState({ schema, total: data?.meta.total })
 * const { data, isLoading } = users.useList(table.params)
 * ```
 */
export function useTableState<TRow>({
  schema,
  syncToUrl = false,
  total,
}: UseTableStateOptions<TRow>): UseTableStateResult<TRow> {
  const [search, setSearchValue] = useState('')
  // The input stays responsive while the request waits for the user to pause.
  const debouncedSearch = useDebouncedValue(search, DEBOUNCE_MS.search)

  const [sort, setSort] = useState<SortState | null>(
    schema.defaultSort
      ? { field: schema.defaultSort.field, direction: schema.defaultSort.direction }
      : null,
  )
  const [filters, setFilters] = useState<FilterValues>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>(() =>
    schema.columns.filter((column) => column.defaultHidden).map((column) => column.id),
  )

  const pagination = usePagination({
    initialPerPage: schema.perPageOptions?.[0] ?? PAGINATION.defaultPerPage,
    total,
    syncToUrl,
  })

  const { setPage } = pagination

  // Narrowing the result set invalidates the current offset: page 7 of a
  // 3-page result is an empty screen that looks like "no records".
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters, setPage])

  const setSearch = useCallback((value: string) => setSearchValue(value), [])

  const toggleSort = useCallback((field: string) => {
    setSort((previous) => {
      if (previous?.field !== field) return { field, direction: 'asc' }
      if (previous.direction === 'asc') return { field, direction: 'desc' }
      // Third click clears, so a user can get back to the server's own order.
      return null
    })
  }, [])

  const setFilter = useCallback((id: string, value: FilterValues[string]) => {
    setFilters((previous) => {
      const next = { ...previous }
      // Empty string and undefined both mean "no filter"; keeping them would
      // send noise to the API and count towards the active-filter badge.
      if (value === undefined || value === '') delete next[id]
      else next[id] = value

      return next
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setSearchValue('')
  }, [])

  const isSelected = useCallback(
    (row: TRow) => selectedIds.includes(schema.rowKey(row)),
    [schema, selectedIds],
  )

  const toggleRow = useCallback(
    (row: TRow) => {
      const id = schema.rowKey(row)
      setSelectedIds((previous) =>
        previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
      )
    },
    [schema],
  )

  const toggleAll = useCallback(
    (rows: TRow[]) => {
      const ids = rows.map(schema.rowKey)
      setSelectedIds((previous) => {
        const allSelected = ids.every((id) => previous.includes(id))

        // Selections on other pages are preserved either way — the header
        // checkbox governs what is on screen, not the whole result set.
        return allSelected
          ? previous.filter((id) => !ids.includes(id))
          : [...previous, ...ids.filter((id) => !previous.includes(id))]
      })
    },
    [schema],
  )

  const clearSelection = useCallback(() => setSelectedIds([]), [])

  const isColumnVisible = useCallback(
    (id: string) => !hiddenColumnIds.includes(id),
    [hiddenColumnIds],
  )

  const toggleColumn = useCallback((id: string) => {
    setHiddenColumnIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    )
  }, [])

  const resetColumns = useCallback(
    () => setHiddenColumnIds(schema.columns.filter((c) => c.defaultHidden).map((c) => c.id)),
    [schema],
  )

  const activeFilterCount =
    Object.keys(filters).length + (debouncedSearch.trim() === '' ? 0 : 1)

  const params = useMemo<ListQueryParams>(
    () => ({
      page: pagination.page,
      perPage: pagination.perPage,
      // Omit empty values so the query key stays stable and the URL stays clean.
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(sort ? { sortBy: sort.field, sortDirection: sort.direction as SortDirection } : {}),
      ...(Object.keys(filters).length > 0 ? { filters } : {}),
    }),
    [debouncedSearch, filters, pagination.page, pagination.perPage, sort],
  )

  return {
    search,
    setSearch,
    sort,
    toggleSort,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    pagination,
    selectedIds,
    isSelected,
    toggleRow,
    toggleAll,
    clearSelection,
    hiddenColumnIds,
    isColumnVisible,
    toggleColumn,
    resetColumns,
    params,
  }
}
