import { Inbox } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { IconComponent } from '@/types/common.types'
import { cn } from '@/utils/cn'

const ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

export interface DataTableColumn<TRow> {
  /** Stable key — also the React key for the cell. */
  id: string
  header: React.ReactNode
  /** Render the cell. Returning a node keeps formatting at the call site. */
  cell: (row: TRow, index: number) => React.ReactNode
  align?: keyof typeof ALIGN_CLASSES
  /** CSS width, e.g. `'12rem'` or `'80px'`. Omit to size to content. */
  width?: string
  /** Allow wrapping; cells are single-line by default. */
  wrap?: boolean
  className?: string
  headerClassName?: string
}

export interface DataTableProps<TRow> {
  columns: DataTableColumn<TRow>[]
  rows: TRow[]
  /** Stable row identity — index is a last resort, not a default. */
  rowKey: (row: TRow, index: number) => string
  isLoading?: boolean
  /** Placeholder rows drawn while loading. */
  skeletonRows?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: IconComponent
  /** Replaces the whole empty block — for a call to action, say. */
  empty?: React.ReactNode
  onRowClick?: (row: TRow, index: number) => void
  /** Pinned below the table, inside its border — the pagination slot. */
  footer?: React.ReactNode
  className?: string
}

/**
 * The standard list surface: bordered container, sticky-ready header, and the
 * three states every list needs — loading, empty, populated.
 *
 * Columns are plain data, so a module declares what to show and never rebuilds
 * the same `<Table>` scaffolding. Deliberately unopinionated about *where* rows
 * come from: sorting, filtering and paging stay with the caller, which is what
 * lets the same component serve client-side and server-side lists.
 */
export function DataTable<TRow>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  skeletonRows = 5,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyIcon = Inbox,
  empty,
  onRowClick,
  footer,
  className,
}: DataTableProps<TRow>) {
  const isEmpty = !isLoading && rows.length === 0
  const isInteractive = Boolean(onRowClick)

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border', className)}>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.id}
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  'text-caption tracking-wide uppercase',
                  ALIGN_CLASSES[column.align ?? 'left'],
                  column.headerClassName,
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading &&
            Array.from({ length: skeletonRows }, (_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {isEmpty && (
            <TableRow className="hover:bg-transparent">
              {/* One full-width cell keeps the empty state centred under the
                  header instead of trapped in the first column. */}
              <TableCell colSpan={columns.length} className="p-0">
                {empty ?? (
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    className="border-none"
                  />
                )}
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            rows.map((row, index) => (
              <TableRow
                key={rowKey(row, index)}
                onClick={isInteractive ? () => onRowClick?.(row, index) : undefined}
                // A clickable row is a control, so it has to be reachable and
                // operable from the keyboard too.
                tabIndex={isInteractive ? 0 : undefined}
                role={isInteractive ? 'button' : undefined}
                onKeyDown={
                  isInteractive
                    ? (event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return
                        event.preventDefault()
                        onRowClick?.(row, index)
                      }
                    : undefined
                }
                className={cn(
                  isInteractive &&
                    'cursor-pointer outline-none focus-visible:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50',
                )}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      ALIGN_CLASSES[column.align ?? 'left'],
                      column.wrap && 'whitespace-normal',
                      column.className,
                    )}
                  >
                    {column.cell(row, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {footer && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
          {footer}
        </div>
      )}
    </div>
  )
}
