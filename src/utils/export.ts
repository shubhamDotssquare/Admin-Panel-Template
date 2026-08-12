/**
 * Client-side file export.
 *
 * Deliberately dependency-free and small: an admin panel's "Export" is usually
 * "give me these rows in a spreadsheet", not a reporting engine. When a project
 * needs styled workbooks or server-side generation, replace this file — nothing
 * else imports a CSV library.
 */

/** A cell value the exporters know how to render. */
export type ExportValue = string | number | boolean | Date | null | undefined

export interface ExportColumn<TRow> {
  /** Column heading in the output file. */
  header: string
  /** Pull the value for one row. */
  value: (row: TRow) => ExportValue
}

function toCell(value: ExportValue): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

/**
 * Escape one CSV field.
 *
 * A leading `=`, `+`, `-` or `@` is prefixed with a quote: spreadsheet software
 * treats those as formulas, which turns an exported cell into code execution on
 * the recipient's machine (CSV injection). The quote is invisible in the cell
 * and neutralises it.
 */
function escapeCsv(value: ExportValue): string {
  const text = toCell(value)
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text

  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded
}

export function toCsv<TRow>(rows: TRow[], columns: ExportColumn<TRow>[]): string {
  const header = columns.map((column) => escapeCsv(column.header)).join(',')
  const body = rows.map((row) =>
    columns.map((column) => escapeCsv(column.value(row))).join(','),
  )

  return [header, ...body].join('\r\n')
}

export function toJson<TRow>(rows: TRow[], columns: ExportColumn<TRow>[]): string {
  const mapped = rows.map((row) =>
    Object.fromEntries(columns.map((column) => [column.header, toCell(column.value(row))])),
  )

  return JSON.stringify(mapped, null, 2)
}

/** Trigger a browser download for generated text. */
export function downloadFile(filename: string, contents: string, mimeType: string): void {
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8;` })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Without this the blob is held for the lifetime of the document.
  URL.revokeObjectURL(url)
}

export type ExportFormat = 'csv' | 'json'

/** Build and download `rows` in the requested format. */
export function exportRows<TRow>(
  rows: TRow[],
  columns: ExportColumn<TRow>[],
  format: ExportFormat,
  baseName = 'export',
): void {
  const stamp = new Date().toISOString().slice(0, 10)
  const filename = `${baseName}-${stamp}.${format}`

  if (format === 'json') {
    downloadFile(filename, toJson(rows, columns), 'application/json')
    return
  }

  downloadFile(filename, toCsv(rows, columns), 'text/csv')
}
