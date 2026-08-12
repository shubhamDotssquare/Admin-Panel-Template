import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAGINATION } from '@/constants/ui'
import type { UsePaginationResult } from '@/hooks/use-pagination'
import { formatNumber } from '@/utils/format'

interface TablePaginationProps {
  pagination: UsePaginationResult
  total?: number
  perPageOptions?: number[]
  /** Rows on screen — used when the total is unknown. */
  rowCount: number
}

/**
 * Page size, range summary and page stepping.
 *
 * Deliberately prev/next rather than numbered pages: with a server-side total
 * the count can change between requests, and numbered links imply a stability
 * the data does not have.
 */
export function TablePagination({
  pagination,
  total,
  perPageOptions = [...PAGINATION.perPageOptions],
  rowCount,
}: TablePaginationProps) {
  const { page, perPage, range, totalPages, canPrevious, canNext } = pagination

  const summary =
    total === undefined
      ? `${formatNumber(rowCount)} ${rowCount === 1 ? 'row' : 'rows'}`
      : total === 0
        ? 'No records'
        : `${formatNumber(range.from)}–${formatNumber(range.to)} of ${formatNumber(total)}`

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-caption text-muted-foreground">{summary}</span>

        <Select
          value={String(perPage)}
          onValueChange={(value) => pagination.setPerPage(Number(value))}
        >
          <SelectTrigger size="sm" className="w-[4.75rem]" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {perPageOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        {totalPages > 0 && (
          <span className="text-caption text-muted-foreground">
            Page {formatNumber(page)} of {formatNumber(totalPages)}
          </span>
        )}

        <Button
          variant="outline"
          size="icon-sm"
          onClick={pagination.previous}
          disabled={!canPrevious}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={pagination.next}
          disabled={!canNext}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </>
  )
}
