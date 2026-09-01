import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { FormPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'
import { notify } from '@/utils/toast'
import { NoteForm } from '../components/note-form'
import { notes } from '../services/note.queries'

/**
 * Create and edit, in one screen.
 *
 * The route decides which: `/notes/new` has no `:noteId`, `/notes/:id/edit`
 * does. Both render the same `NoteForm`, so the two paths cannot drift.
 */
export function NoteFormPage() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(noteId)
  const { data: note, isLoading, isError } = notes.useDetail(noteId)

  const create = notes.useCreate()
  const update = notes.useUpdate()

  const backTo = isEdit && noteId ? route(PATHS.notes, noteId) : PATHS.notes

  return (
    <FormPage
      title={isEdit ? `Edit ${note?.title ?? 'note'}` : 'Add note'}
      description={isEdit ? 'Update this note’s content and status.' : 'Create a new note.'}
      backTo={backTo}
      backLabel={isEdit ? 'Back to note' : 'Back to notes'}
      isLoading={isEdit && isLoading}
      error={
        isError && (
          <EmptyState
            title="Note not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={PATHS.notes}>Back to notes</Link>
              </Button>
            }
          />
        )
      }
    >
      <NoteForm
        note={note}
        onCancel={() => navigate(backTo)}
        onSubmit={async (values) => {
          if (isEdit && noteId) {
            await update.mutateAsync({ id: noteId, payload: values })
            notify.success('Note updated')
            navigate(route(PATHS.notes, noteId))
            return
          }

          const created = await create.mutateAsync(values)
          notify.success('Note created')
          navigate(route(PATHS.notes, created.id))
        }}
      />
    </FormPage>
  )
}

export default NoteFormPage
