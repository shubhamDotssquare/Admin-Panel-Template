import { Info, Pencil, RotateCcw } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { DescriptionList, DetailPage, StatusBadge } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePermission } from '@/hooks/use-permission'
import { PATHS, route } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import { formatDate } from '@/utils/format'
import { notify } from '@/utils/toast'
import { notes, useRestoreNote } from '../services/note.queries'
import { NOTE_STATUS } from '../types'

export function NoteDetailPage() {
  const { noteId } = useParams<{ noteId: string }>()

  const { data: note, isLoading, isError } = notes.useDetail(noteId)
  const restore = useRestoreNote()
  const canUpdate = usePermission(PERMISSIONS.notesUpdate)

  if (isError || (!isLoading && !note)) {
    return (
      <PageContainer>
        <EmptyState
          title="Note not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={PATHS.notes}>Back to notes</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  return (
    <DetailPage
      title={note?.title ?? 'Loading…'}
      isLoading={isLoading}
      backTo={PATHS.notes}
      backLabel="Back to notes"
      status={note && <StatusBadge status={note.status} map={NOTE_STATUS} />}
      meta={note ? [{ label: 'Updated', value: formatDate(note.updatedAt) }] : undefined}
      actions={
        note &&
        canUpdate && (
          <>
            {note.status === 'DELETED' ? (
              <Button
                size="sm"
                disabled={restore.isPending}
                onClick={async () => {
                  await restore.mutateAsync(note.id)
                  notify.success(`${note.title} restored`)
                }}
              >
                <RotateCcw className="size-4" />
                Restore
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to={route(PATHS.notes, note.id, 'edit')}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
            )}
          </>
        )
      }
      tabs={[
        {
          id: 'overview',
          label: 'Overview',
          icon: Info,
          content: (
            <Card>
              <CardContent>
                <DescriptionList
                  isLoading={isLoading}
                  items={[
                    { label: 'Title', value: note?.title },
                    { label: 'Body', value: note?.body || '—' },
                    {
                      label: 'Status',
                      value: note && <StatusBadge status={note.status} map={NOTE_STATUS} />,
                    },
                    { label: 'Created', value: note?.createdAt ? formatDate(note.createdAt) : '—' },
                    { label: 'Note ID', value: note?.id },
                  ]}
                />
              </CardContent>
            </Card>
          ),
        },
      ]}
    />
  )
}

export default NoteDetailPage
