import { z } from 'zod'

import { Form, FormActions, FormSection, TextField, TextareaField, useAppForm } from '@/components/form'
import { requiredString } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import type { ActivityFeedItem, CreateActivityFeedItemDto } from '../types'

const activityFeedSchema = z.object({
  type: requiredString('Enter a type.').max(120, 'Must be 120 characters or fewer.'),
  message: requiredString('Enter a message.').max(2000, 'Must be 2000 characters or fewer.'),
})

export type ActivityFeedFormValues = z.infer<typeof activityFeedSchema>

interface ActivityFeedFormProps {
  /** Omit to create. */
  item?: ActivityFeedItem
  onSubmit: (values: CreateActivityFeedItemDto) => Promise<unknown>
  onCancel: () => void
}

export function ActivityFeedForm({ item, onSubmit, onCancel }: ActivityFeedFormProps) {
  const form = useAppForm<ActivityFeedFormValues>({
    schema: activityFeedSchema,
    defaultValues: {
      type: item?.type ?? '',
      message: item?.message ?? '',
    },
  })

  return (
    <Form
      form={form}
      mapError={resolveAuthError}
      onSubmit={(values) =>
        onSubmit({
          type: values.type,
          message: values.message,
        })
      }
    >
      <FormSection title="Activity">
        <TextField<ActivityFeedFormValues>
          name="type"
          label="Type"
          required
          placeholder="user_registered"
        />

        <TextareaField<ActivityFeedFormValues>
          name="message"
          label="Message"
          rows={4}
          placeholder="A new user just signed up."
        />
      </FormSection>

      <FormActions
        submitLabel={item ? 'Save changes' : 'Create entry'}
        onCancel={onCancel}
        requireDirty={Boolean(item)}
      />
    </Form>
  )
}
