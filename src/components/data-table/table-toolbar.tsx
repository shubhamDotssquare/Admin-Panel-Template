import { Columns3, Download, Search, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UseTableStateResult } from '@/hooks/use-table-state'
import type { FilterSchema, TableSchema } from '@/types/table.types'
import type { ExportFormat } from '@/utils/export'
import { cn } from '@/utils/cn'

/** Sentinel for the "no filter" option — Radix Select rejects an empty value. */
const ANY = '__any'

function FilterControl<TRow>({
  filter,
  table,
}: {
  filter: FilterSchema
  table: UseTableStateResult<TRow>
}) {
  const value = table.filters[filter.id]

  if (filter.type === 'text') {
    return (
      <Input
        size="sm"
        className="w-40"
        placeholder={filter.placeholder ?? filter.label}
        aria-label={filter.label}
        value={(value as string) ?? ''}
        onChange={(event) => table.setFilter(filter.id, event.target.value)}
      />
    )
  }

  const options =
    filter.type === 'boolean'
      ? [
          { label: filter.trueLabel ?? 'Yes', value: 'true' },
          { label: filter.falseLabel ?? 'No', value: 'false' },
        ]
      : filter.options.map((option) => ({ label: option.label, value: String(option.value) }))

  const anyLabel = filter.type === 'select' ? (filter.anyLabel ?? `All ${filter.label}`) : `All`

  return (
    <Select
      value={value === undefined ? ANY : String(value)}
      onValueChange={(next) => {
        if (next === ANY) return table.setFilter(filter.id, undefined)
        // Booleans must round-trip as booleans, not the string "true".
        table.setFilter(filter.id, filter.type === 'boolean' ? next === 'true' : next)
      }}
    >
      <SelectTrigger size="sm" className="w-40" aria-label={filter.label}>
        <SelectValue placeholder={filter.label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{anyLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface TableToolbarProps<TRow> {
  schema: TableSchema<TRow>
  table: UseTableStateResult<TRow>
  onExport: (format: ExportFormat, scope: 'page' | 'all') => void
  isExporting?: boolean
  /** Buttons owned by the page, e.g. "Add user". */
  actions?: React.ReactNode
  className?: string
}

/**
 * Search, filters, column visibility and export.
 *
 * Every control is driven by the schema, so a module gets the whole row by
 * describing its columns and filters — there is nothing to wire per screen.
 */
export function TableToolbar<TRow>({
  schema,
  table,
  onExport,
  isExporting = false,
  actions,
  className,
}: TableToolbarProps<TRow>) {
  const hideableColumns = schema.columns.filter((column) => column.hideable !== false)
  const exportConfig = schema.export
  const showExport = exportConfig?.enabled !== false && Boolean(exportConfig)
  const formats: ExportFormat[] = exportConfig?.formats ?? ['csv', 'json']

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {schema.search && (
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            size="sm"
            className="pl-8"
            type="search"
            placeholder={schema.search.placeholder ?? 'Search…'}
            aria-label="Search"
            value={table.search}
            onChange={(event) => table.setSearch(event.target.value)}
          />
        </div>
      )}

      {schema.filters?.map((filter) => (
        <FilterControl key={filter.id} filter={filter} table={table} />
      ))}

      {table.activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={table.clearFilters}>
          <X className="size-4" />
          Clear
          <Badge variant="secondary">{table.activeFilterCount}</Badge>
        </Button>
      )}

      {/* Everything after this sits on the right. */}
      <div className="ml-auto flex items-center gap-2">
        {actions}

        {hideableColumns.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="size-4" />
                <span className="sr-only sm:not-sr-only">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {hideableColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={table.isColumnVisible(column.id)}
                  // Radix closes on select by default; keeping it open lets the
                  // user toggle several columns in one visit.
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={() => table.toggleColumn(column.id)}
                >
                  {column.exportHeader ??
                    (typeof column.header === 'string' ? column.header : column.id)}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={table.resetColumns}>Reset</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {showExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                <Download className="size-4" />
                <span className="sr-only sm:not-sr-only">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>This page</DropdownMenuLabel>
              {formats.map((format) => (
                <DropdownMenuItem
                  key={`page-${format}`}
                  onSelect={() => onExport(format, 'page')}
                >
                  {format.toUpperCase()}
                </DropdownMenuItem>
              ))}

              {/* Only offered when the caller can actually fetch everything —
                  promising "all records" without a fetcher would be a lie. */}
              {exportConfig?.fetchAll && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>All matching records</DropdownMenuLabel>
                  {formats.map((format) => (
                    <DropdownMenuItem
                      key={`all-${format}`}
                      onSelect={() => onExport(format, 'all')}
                    >
                      {format.toUpperCase()}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
