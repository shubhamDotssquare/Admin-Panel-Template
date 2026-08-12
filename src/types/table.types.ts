import type { ExportFormat, ExportValue } from '@/utils/export'
import type { IconComponent, SelectOption, SortDirection } from './common.types'

/**
 * The table framework's contract.
 *
 * A module describes its list screen as data — columns, filters, actions — and
 * the framework supplies searching, sorting, paging, selection, column
 * visibility, export and empty states. Nothing here knows what a User or a Page
 * is, which is what lets Admin Manager, CMS, Enquiries and the rest share one
 * implementation.
 */

export type ColumnAlign = 'left' | 'center' | 'right'

export interface ColumnSchema<TRow> {
  /** Stable id — the React key, the visibility key, and the default sort key. */
  id: string
  header: React.ReactNode
  /**
   * Plain value for this cell, used for export and as the fallback rendering.
   * Prefer defining it even when `cell` is supplied: an exported spreadsheet
   * should contain the value, not the badge you drew around it.
   */
  accessor?: (row: TRow) => ExportValue
  /** Custom rendering. Falls back to `accessor` when omitted. */
  cell?: (row: TRow, index: number) => React.ReactNode
  /** Adds a sort control to the header. */
  sortable?: boolean
  /** Field name the API sorts by, when it differs from `id`. */
  sortKey?: string
  align?: ColumnAlign
  /** CSS width, e.g. `'12rem'`. Omit to size to content. */
  width?: string
  /** Allow wrapping; cells are single-line by default. */
  wrap?: boolean
  className?: string
  headerClassName?: string
  /** Set false to pin the column into view. Defaults to true. */
  hideable?: boolean
  /** Start hidden — useful for secondary detail the user can opt into. */
  defaultHidden?: boolean
  /** Set false to leave the column out of exports. Defaults to true. */
  exportable?: boolean
  /** Heading used in exports, when the visible header is a node. */
  exportHeader?: string
}

/** A filter control rendered in the toolbar. Values land in `params.filters`. */
export type FilterSchema =
  | {
      id: string
      label: string
      type: 'select'
      options: SelectOption[]
      /** Copy for the "no filter" option. */
      anyLabel?: string
    }
  | { id: string; label: string; type: 'boolean'; trueLabel?: string; falseLabel?: string }
  | { id: string; label: string; type: 'text'; placeholder?: string }

/** Confirmation shown before an action runs. */
export interface ActionConfirm {
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  destructive?: boolean
}

export interface RowAction<TRow> {
  id: string
  /** A function receives the row, for labels like `Suspend {name}`. */
  label: string | ((row: TRow) => string)
  icon?: IconComponent
  /**
   * `unknown` rather than `void | Promise<void>` so ordinary one-liners type-check:
   * `notify.success(…)` returns a toast id and `mutateAsync(…)` a typed promise,
   * and neither should have to be wrapped in a block to satisfy the signature.
   * The framework awaits whatever comes back.
   */
  onSelect: (row: TRow) => unknown
  /** Remove the item entirely for this row. */
  hidden?: (row: TRow) => boolean
  /** Render it, but inert — with a reason the UI can show. */
  disabled?: (row: TRow) => boolean
  destructive?: boolean
  confirm?: ActionConfirm | ((row: TRow) => ActionConfirm)
}

export interface BulkAction<TRow> {
  id: string
  label: string
  icon?: IconComponent
  destructive?: boolean
  confirm?: ActionConfirm | ((rows: TRow[]) => ActionConfirm)
  onSelect: (rows: TRow[]) => unknown
}

export interface TableExportConfig<TRow> {
  enabled?: boolean
  /** Base filename; a date and extension are appended. */
  filename?: string
  formats?: ExportFormat[]
  /**
   * Fetch every matching record for a full export.
   *
   * Without it only the loaded page can be exported — which is honest but rarely
   * what someone clicking "Export" means, so the menu says which it is.
   */
  fetchAll?: () => Promise<TRow[]>
}

export interface TableSchema<TRow> {
  columns: ColumnSchema<TRow>[]
  /** Stable row identity. Selection and React keys both depend on it. */
  rowKey: (row: TRow) => string
  /** Toolbar search box. Omit to hide it. */
  search?: { placeholder?: string }
  filters?: FilterSchema[]
  rowActions?: RowAction<TRow>[]
  /** Enables the selection column when non-empty. */
  bulkActions?: BulkAction<TRow>[]
  /** Allow selection without bulk actions — for a custom selection UI. */
  selectable?: boolean
  export?: TableExportConfig<TRow>
  empty?: { icon?: IconComponent; title?: string; description?: string }
  defaultSort?: { field: string; direction: SortDirection }
  /** Rows per page offered in the footer. */
  perPageOptions?: number[]
  /** Clicking a row — usually "open the record". */
  onRowClick?: (row: TRow) => void
}

/** Filter values, keyed by `FilterSchema.id`. */
export type FilterValues = Record<string, string | number | boolean | undefined>
