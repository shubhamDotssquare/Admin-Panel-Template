import { useCallback, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Lock,
  MoreHorizontal,
  X,
} from 'lucide-react'

import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/common/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useConfirm } from '@/hooks/use-confirm'
import type { UseTableStateResult } from '@/hooks/use-table-state'
import type {
  ActionConfirm,
  BulkAction,
  ColumnSchema,
  RowAction,
  TableSchema,
} from '@/types/table.types'
import { AUTH_ERROR_CODES } from '@/constants/auth-errors'
import { resolveAuthError } from '@/services/auth-error'
import { cn } from '@/utils/cn'
import { exportRows, type ExportColumn, type ExportFormat } from '@/utils/export'
import { notify } from '@/utils/toast'
import { TablePagination } from './table-pagination'
import { TableToolbar } from './table-toolbar'

/** Reserved column ids, kept out of the schema's namespace. */
const SELECT_COLUMN = '__select'
const ACTIONS_COLUMN = '__actions'

function headerText<TRow>(column: ColumnSchema<TRow>): string {
  if (column.exportHeader) return column.exportHeader
  return typeof column.header === 'string' ? column.header : column.id
}

function resolveConfirm<T>(
  confirm: ActionConfirm | ((value: T) => ActionConfirm | undefined) | undefined,
  value: T,
): ActionConfirm | undefined {
  return typeof confirm === 'function' ? confirm(value) : confirm
}

export interface CrudTableProps<TRow> {
  schema: TableSchema<TRow>
  table: UseTableStateResult<TRow>
  rows: TRow[]
  total?: number
  isLoading?: boolean
  /**
   * A failed list query. Rendered in place of the table.
   *
   * Worth passing: a permission failure otherwise shows an empty table, which
   * reads as "there is nothing here" rather than "you may not see this".
   */
  error?: unknown
  /** Buttons for the toolbar's right side, e.g. "Add user". */
  actions?: React.ReactNode
  className?: string
}

/**
 * A complete list screen, assembled from a schema.
 *
 * Search, sorting, filtering, paging, selection, column visibility, row and bulk
 * actions, export and empty states all come from `schema` — a module supplies
 * data and gets the behaviour. Fetching stays with the page, because only the
 * page knows which service to call:
 *
 * ```tsx
 * const table = useTableState({ schema, total: data?.meta.total })
 * const { data, isLoading } = users.useList(table.params)
 *
 * <CrudTable schema={schema} table={table} rows={data?.items ?? []}
 *            total={data?.meta.total} isLoading={isLoading} />
 * ```
 */
export function CrudTable<TRow>({
  schema,
  table,
  rows,
  total,
  isLoading = false,
  error,
  actions,
  className,
}: CrudTableProps<TRow>) {
  const confirm = useConfirm()
  const [isExporting, setExporting] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const selectable = Boolean(schema.selectable ?? schema.bulkActions?.length)
  const selectedRows = useMemo(() => rows.filter((row) => table.isSelected(row)), [rows, table])

  // ── Export ────────────────────────────────────────────────────────
  const exportColumns = useMemo<ExportColumn<TRow>[]>(
    () =>
      schema.columns
        .filter((column) => column.exportable !== false && column.accessor)
        .map((column) => ({
          header: headerText(column),
          value: (row: TRow) => column.accessor?.(row) ?? '',
        })),
    [schema.columns],
  )

  const handleExport = useCallback(
    async (format: ExportFormat, scope: 'page' | 'all') => {
      if (exportColumns.length === 0) {
        notify.error('Nothing to export', {
          description: 'No column defines an accessor for its value.',
        })
        return
      }

      setExporting(true)
      try {
        const data =
          scope === 'all' && schema.export?.fetchAll ? await schema.export.fetchAll() : rows

        exportRows(data, exportColumns, format, schema.export?.filename ?? 'export')
        notify.success(`Exported ${data.length} ${data.length === 1 ? 'row' : 'rows'}`)
      } catch (error) {
        notify.fromError(error, 'Export failed')
      } finally {
        setExporting(false)
      }
    },
    [exportColumns, rows, schema.export],
  )

  // ── Actions ───────────────────────────────────────────────────────
  const runRowAction = useCallback(
    async (action: RowAction<TRow>, row: TRow) => {
      const confirmation = resolveConfirm(action.confirm, row)
      if (confirmation) {
        const ok = await confirm({
          title: confirmation.title,
          description: confirmation.description,
          confirmLabel: confirmation.confirmLabel,
          tone: (confirmation.destructive ?? action.destructive) ? 'destructive' : 'default',
        })
        if (!ok) return
      }

      setPendingAction(action.id)
      try {
        await action.onSelect(row)
      } catch (error) {
        notify.fromError(error)
      } finally {
        setPendingAction(null)
      }
    },
    [confirm],
  )

  const runBulkAction = useCallback(
    async (action: BulkAction<TRow>) => {
      if (selectedRows.length === 0) return

      const confirmation = resolveConfirm(action.confirm, selectedRows)
      if (confirmation) {
        const ok = await confirm({
          title: confirmation.title,
          description: confirmation.description,
          confirmLabel: confirmation.confirmLabel,
          tone: (confirmation.destructive ?? action.destructive) ? 'destructive' : 'default',
        })
        if (!ok) return
      }

      setPendingAction(action.id)
      try {
        await action.onSelect(selectedRows)
        // The rows may no longer exist; a stale selection would act on ghosts.
        table.clearSelection()
      } catch (error) {
        notify.fromError(error)
      } finally {
        setPendingAction(null)
      }
    },
    [confirm, selectedRows, table],
  )

  // ── Columns ───────────────────────────────────────────────────────
  const columns = useMemo<DataTableColumn<TRow>[]>(() => {
    const visible = schema.columns.filter((column) => table.isColumnVisible(column.id))

    const built: DataTableColumn<TRow>[] = visible.map((column) => ({
      id: column.id,
      header: column.sortable ? (
        <SortButton
          label={column.header}
          active={table.sort?.field === (column.sortKey ?? column.id)}
          direction={table.sort?.direction}
          onToggle={() => table.toggleSort(column.sortKey ?? column.id)}
        />
      ) : (
        column.header
      ),
      cell: (row, index) =>
        column.cell ? column.cell(row, index) : String(column.accessor?.(row) ?? ''),
      align: column.align,
      width: column.width,
      wrap: column.wrap,
      className: column.className,
      headerClassName: column.headerClassName,
    }))

    if (selectable) {
      const pageIds = rows.map(schema.rowKey)
      const selectedOnPage = pageIds.filter((id) => table.selectedIds.includes(id))
      const headerState =
        selectedOnPage.length === 0
          ? false
          : selectedOnPage.length === pageIds.length
            ? true
            : 'indeterminate'

      built.unshift({
        id: SELECT_COLUMN,
        width: '2.75rem',
        headerClassName: 'pr-0',
        className: 'pr-0',
        header: (
          <Checkbox
            checked={headerState}
            disabled={rows.length === 0}
            onCheckedChange={() => table.toggleAll(rows)}
            aria-label="Select all rows on this page"
          />
        ),
        cell: (row) => (
          // The row itself may be clickable; selecting must not also navigate.
          <span
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Checkbox
              checked={table.isSelected(row)}
              onCheckedChange={() => table.toggleRow(row)}
              aria-label="Select row"
            />
          </span>
        ),
      })
    }

    if (schema.rowActions?.length) {
      built.push({
        id: ACTIONS_COLUMN,
        header: <span className="sr-only">Actions</span>,
        align: 'right',
        width: '4rem',
        cell: (row) => {
          const available = schema.rowActions?.filter((action) => !action.hidden?.(row)) ?? []
          if (available.length === 0) return null

          return (
            <span
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {available.map((action) => (
                    <DropdownMenuItem
                      key={action.id}
                      variant={action.destructive ? 'destructive' : 'default'}
                      disabled={action.disabled?.(row) || pendingAction === action.id}
                      onSelect={() => void runRowAction(action, row)}
                    >
                      {action.icon && <action.icon className="size-4" />}
                      {typeof action.label === 'function' ? action.label(row) : action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          )
        },
      })
    }

    return built
  }, [pendingAction, rows, runRowAction, schema, selectable, table])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <TableToolbar
        schema={schema}
        table={table}
        onExport={(format, scope) => void handleExport(format, scope)}
        isExporting={isExporting}
        actions={actions}
      />

      {selectedRows.length > 0 && schema.bulkActions?.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="text-caption font-medium">{table.selectedIds.length} selected</span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {schema.bulkActions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant={action.destructive ? 'destructive' : 'outline'}
                disabled={pendingAction === action.id}
                onClick={() => void runBulkAction(action)}
              >
                {pendingAction === action.id ? (
                  <Spinner size="sm" />
                ) : (
                  action.icon && <action.icon className="size-4" />
                )}
                {action.label}
              </Button>
            ))}

            <Button variant="ghost" size="sm" onClick={table.clearSelection}>
              <X className="size-4" />
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <ErrorState error={error} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={schema.rowKey}
          isLoading={isLoading}
          onRowClick={schema.onRowClick}
          emptyIcon={schema.empty?.icon}
          emptyTitle={
            schema.empty?.title ??
            (table.activeFilterCount > 0 ? 'No matching records' : 'Nothing here yet')
          }
          emptyDescription={
            table.activeFilterCount > 0
              ? 'Try a different search or clear the filters.'
              : schema.empty?.description
          }
          footer={
            <TablePagination
              pagination={table.pagination}
              total={total}
              perPageOptions={schema.perPageOptions}
              rowCount={rows.length}
            />
          }
        />
      )}
    </div>
  )
}

/** A failed list query, with permission denials called out as such. */
function ErrorState({ error }: { error: unknown }) {
  const resolved = resolveAuthError(error)
  const isDenied = resolved.code === AUTH_ERROR_CODES.permissionDenied

  return (
    <div className="rounded-lg border border-border">
      <EmptyState
        icon={isDenied ? Lock : AlertTriangle}
        title={
          isDenied ? 'You do not have permission to view this' : 'Could not load this list'
        }
        description={resolved.message}
        className="border-none"
      />
    </div>
  )
}

/** Header button that cycles a column's sort direction. */
function SortButton({
  label,
  active,
  direction,
  onToggle,
}: {
  label: React.ReactNode
  active: boolean
  direction?: 'asc' | 'desc'
  onToggle: () => void
}) {
  const Icon = !active ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'group/sort -mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-1 outline-none',
        'hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
        active && 'text-foreground',
      )}
      aria-label={`Sort by ${typeof label === 'string' ? label : 'column'}`}
    >
      {label}
      <Icon
        className={cn(
          'size-3.5 shrink-0 transition-opacity',
          active ? 'opacity-100' : 'opacity-40 group-hover/sort:opacity-70',
        )}
        aria-hidden="true"
      />
    </button>
  )
}
