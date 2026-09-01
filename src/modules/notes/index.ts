import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const NoteListPage = lazy(() => import('./pages/note-list-page'))
const NoteDetailPage = lazy(() => import('./pages/note-detail-page'))
const NoteFormPage = lazy(() => import('./pages/note-form-page'))

/**
 * Notes: list, detail, create, edit, plus soft-delete and restore.
 *
 * `new` is declared before `:noteId` for readability; React Router ranks
 * static segments above dynamic ones regardless, so `/notes/new` can never be
 * read as a note whose id is "new".
 */
export const notesModule: ModuleDefinition = {
  id: 'notes',
  title: 'Notes',
  basePath: PATHS.notes,
  enabled: true,
  routes: [
    { path: PATHS.notes, Component: NoteListPage },
    { path: route(PATHS.notes, 'new'), Component: NoteFormPage },
    { path: route(PATHS.notes, ':noteId'), Component: NoteDetailPage },
    { path: route(PATHS.notes, ':noteId', 'edit'), Component: NoteFormPage },
  ],
}

export default notesModule
