import { Download, File, FileImage, FileSpreadsheet, FileText, Trash2 } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { IconComponent } from '@/types/common.types'
import { formatBytes, formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'

export interface FileItem {
  id: string
  name: string
  /** Bytes. Rendered with `formatBytes`. */
  size?: number
  /** MIME type, used to pick the icon. */
  mimeType?: string
  uploadedAt?: string | number | Date
  uploadedBy?: string
  /** Download target. Without it the download control is hidden. */
  url?: string
}

/** Icon by broad file family — enough to scan a list, not a full type map. */
function iconFor(mimeType: string | undefined): IconComponent {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.includes('sheet') || mimeType.includes('csv')) return FileSpreadsheet
  if (mimeType.startsWith('text/') || mimeType.includes('pdf')) return FileText
  return File
}

export interface FileListProps {
  files: FileItem[]
  isLoading?: boolean
  /** Omit to make the list read-only. */
  onRemove?: (file: FileItem) => void
  /** Upload control rendered above the list. */
  action?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

/** Attachments for a record — the "Files" tab. */
export function FileList({
  files,
  isLoading = false,
  onRemove,
  action,
  emptyTitle = 'No files attached',
  emptyDescription = 'Uploaded files will appear here.',
  className,
}: FileListProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {action && <div className="flex justify-end">{action}</div>}

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-14 rounded-md" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} className="border-none" />
      ) : (
        <ul className="flex flex-col gap-2">
          {files.map((file) => {
            const Icon = iconFor(file.mimeType)

            return (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>

                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-body font-medium">{file.name}</span>
                  <span className="text-caption text-muted-foreground">
                    {[
                      file.size !== undefined ? formatBytes(file.size) : null,
                      file.uploadedAt ? formatRelativeTime(file.uploadedAt) : null,
                      file.uploadedBy,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>

                <div className="ml-auto flex items-center gap-1">
                  {file.url && (
                    <Button asChild variant="ghost" size="icon-sm">
                      <a
                        href={file.url}
                        download={file.name}
                        aria-label={`Download ${file.name}`}
                      >
                        <Download className="size-4" />
                      </a>
                    </Button>
                  )}

                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemove(file)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
