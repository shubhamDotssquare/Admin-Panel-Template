import type { StatusMap } from '@/components/patterns'

/**
 * Lifecycle of a note.
 *
 * `DELETED` is a server-only soft-delete state reached via the restore/delete
 * flow — it is never offered as a choice in the create/edit form.
 */
export type NoteStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED'

/** The subset of `NoteStatus` selectable from the form. */
export type EditableNoteStatus = Exclude<NoteStatus, 'DELETED'>

/** `Note` from the API. */
export interface Note {
  id: string
  title: string
  body?: string | null
  status: NoteStatus
  createdAt: string
  updatedAt: string
}

export interface CreateNoteDto {
  title: string
  body?: string
  status?: EditableNoteStatus
}

export type UpdateNoteDto = Partial<CreateNoteDto>

export const NOTE_STATUS: StatusMap<NoteStatus> = {
  ACTIVE: { label: 'Active', tone: 'success' },
  PENDING: { label: 'Pending', tone: 'warning' },
  INACTIVE: { label: 'Inactive', tone: 'neutral' },
  SUSPENDED: { label: 'Suspended', tone: 'destructive' },
  DELETED: { label: 'Deleted', tone: 'destructive', description: 'Soft-deleted. Can be restored.' },
}

/** Only the statuses a person can choose when creating or editing a note. */
export const NOTE_STATUS_OPTIONS: { label: string; value: EditableNoteStatus }[] = (
  ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'] as EditableNoteStatus[]
).map((value) => ({ label: NOTE_STATUS[value].label, value }))

/** Every status, for the list filter — including `DELETED`. */
export const NOTE_FILTER_OPTIONS = (Object.keys(NOTE_STATUS) as NoteStatus[]).map((value) => ({
  label: NOTE_STATUS[value].label,
  value,
}))
