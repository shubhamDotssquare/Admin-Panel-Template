import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createResourceQueries } from '@/lib/create-resource-queries'
import { httpClient } from '@/services/http-client'
import type { CreateNoteDto, Note, UpdateNoteDto } from '../types'

export const notes = createResourceQueries<Note, CreateNoteDto, UpdateNoteDto>('notes', '/notes')

/** Restores a soft-deleted note — its own endpoint, not a status PATCH. */
export function useRestoreNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => httpClient.post<Note>(`/notes/${id}/restore`),
    meta: { invalidates: [notes.keys.all()] },
    onSuccess: (updated) => {
      if (updated?.id) queryClient.setQueryData(notes.keys.detail(updated.id), updated)
    },
  })
}
