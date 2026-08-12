import { useState } from 'react'
import { Pin, Trash2 } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { formatDateTime, formatRelativeTime } from '@/utils/format'
import { initials } from '@/utils/string'
import { cn } from '@/utils/cn'

export interface NoteItem {
  id: string
  body: string
  author?: string
  createdAt?: string | number | Date
  /** Pinned notes sort to the top and carry a marker. */
  pinned?: boolean
}

export interface NoteListProps {
  notes: NoteItem[]
  isLoading?: boolean
  /** Omit to hide the composer and make the list read-only. */
  onAdd?: (body: string) => unknown
  onRemove?: (note: NoteItem) => void
  placeholder?: string
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

/**
 * Internal commentary on a record — the "Notes" tab.
 *
 * The composer is plain text on purpose: notes are for colleagues, and a rich
 * editor is a dependency and a migration this framework should not assume.
 */
export function NoteList({
  notes,
  isLoading = false,
  onAdd,
  onRemove,
  placeholder = 'Add a note…',
  emptyTitle = 'No notes yet',
  emptyDescription = 'Notes are visible to your team, not to the customer.',
  className,
}: NoteListProps) {
  const [draft, setDraft] = useState('')
  const [isSaving, setSaving] = useState(false)

  // Pinned first, then newest — stable regardless of the order supplied.
  const ordered = [...notes].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
    const left = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const right = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return right - left
  })

  const submit = async (): Promise<void> => {
    const body = draft.trim()
    if (!body || !onAdd) return

    setSaving(true)
    try {
      await onAdd(body)
      // Cleared only on success, so a failed save does not lose the text.
      setDraft('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {onAdd && (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
            rows={3}
            aria-label="New note"
            className={cn(
              'w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none',
              'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              'dark:bg-input/30',
            )}
            onKeyDown={(event) => {
              // ⌘/Ctrl+Enter submits — plain Enter must still make a paragraph.
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void submit()
            }}
          />

          <div className="flex items-center justify-end gap-2">
            <span className="mr-auto text-caption text-muted-foreground">
              ⌘ + Enter to save
            </span>
            <Button
              size="sm"
              onClick={() => void submit()}
              disabled={!draft.trim() || isSaving}
            >
              {isSaving && <Spinner size="sm" />}
              Add note
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-md" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} className="border-none" />
      ) : (
        <ul className="flex flex-col gap-3">
          {ordered.map((note) => (
            <li
              key={note.id}
              className={cn(
                'flex gap-3 rounded-md border border-border p-3',
                note.pinned && 'border-primary/30 bg-primary/5',
              )}
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-caption">
                  {initials(note.author ?? '?')}
                </AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-body font-medium">{note.author ?? 'Unknown'}</span>
                  {note.createdAt && (
                    <time
                      className="text-caption text-muted-foreground"
                      dateTime={new Date(note.createdAt).toISOString()}
                      title={formatDateTime(note.createdAt)}
                    >
                      {formatRelativeTime(note.createdAt)}
                    </time>
                  )}
                  {note.pinned && (
                    <span className="inline-flex items-center gap-1 text-caption text-primary">
                      <Pin className="size-3" aria-hidden="true" />
                      Pinned
                    </span>
                  )}
                </div>

                {/* Preserve the author's line breaks without allowing markup. */}
                <p className="text-body whitespace-pre-wrap">{note.body}</p>
              </div>

              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemove(note)}
                  aria-label="Delete note"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
