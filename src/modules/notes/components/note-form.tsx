import { z } from 'zod'

import {
  Form,
  FormActions,
  FormSection,
  SelectField,
  TextField,
  TextareaField,
  useAppForm,
} from '@/components/form'
import { requiredString } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import { NOTE_STATUS_OPTIONS, type CreateNoteDto, type EditableNoteStatus, type Note } from '../types'

const noteSchema = z.object({
  title: requiredString('Enter a title.').max(160, 'Must be 160 characters or fewer.'),
  body: z.string().trim().max(5000, 'Must be 5000 characters or fewer.'),
  status: z.string().min(1, 'Choose a status.'),
})

export type NoteFormValues = z.infer<typeof noteSchema>

interface NoteFormProps {
  /** Omit to create. */
  note?: Note
  onSubmit: (values: CreateNoteDto) => Promise<unknown>
  onCancel: () => void
}

export function NoteForm({ note, onSubmit, onCancel }: NoteFormProps) {
  const form = useAppForm<NoteFormValues>({
    schema: noteSchema,
    defaultValues: {
      title: note?.title ?? '',
      body: note?.body ?? '',
      // `DELETED` is server-only and never offered here, so a note in that
      // state that somehow reaches this form falls back to `ACTIVE`.
      status: note && note.status !== 'DELETED' ? note.status : 'ACTIVE',
    },
  })

  return (
    <Form
      form={form}
      mapError={resolveAuthError}
      onSubmit={(values) =>
        onSubmit({
          title: values.title,
          body: values.body || undefined,
          status: values.status as EditableNoteStatus,
        })
      }
    >
      <FormSection title="Note">
        <TextField<NoteFormValues> name="title" label="Title" required placeholder="Meeting notes" />
        <TextareaField<NoteFormValues> name="body" label="Body" rows={8} placeholder="Write the note…" />
        <SelectField<NoteFormValues>
          name="status"
          label="Status"
          required
          options={NOTE_STATUS_OPTIONS}
        />
      </FormSection>

      <FormActions
        submitLabel={note ? 'Save changes' : 'Create note'}
        onCancel={onCancel}
        requireDirty={Boolean(note)}
      />
    </Form>
  )
}
