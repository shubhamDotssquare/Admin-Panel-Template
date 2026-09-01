import { z } from 'zod'

import {
  FieldGroup,
  Form,
  FormActions,
  FormSection,
  TextField,
  TextareaField,
  useAppForm,
} from '@/components/form'
import { requiredString } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import type { CreateNotificationDto, Notification } from '../types'

const notificationSchema = z.object({
  title: requiredString('Enter a title.').max(160, 'Must be 160 characters or fewer.'),
  message: requiredString('Enter a message.').max(2000, 'Must be 2000 characters or fewer.'),
  type: requiredString('Enter a type.').max(60, 'Must be 60 characters or fewer.'),
  recipientAdminId: z.string().trim().max(64, 'Must be 64 characters or fewer.'),
})

export type NotificationFormValues = z.infer<typeof notificationSchema>

interface NotificationFormProps {
  /** Omit to create. */
  notification?: Notification
  onSubmit: (values: CreateNotificationDto) => Promise<unknown>
  onCancel: () => void
}

export function NotificationForm({ notification, onSubmit, onCancel }: NotificationFormProps) {
  const form = useAppForm<NotificationFormValues>({
    schema: notificationSchema,
    defaultValues: {
      title: notification?.title ?? '',
      message: notification?.message ?? '',
      type: notification?.type ?? '',
      recipientAdminId: notification?.recipientAdminId ?? '',
    },
  })

  return (
    <Form
      form={form}
      mapError={resolveAuthError}
      onSubmit={(values) =>
        onSubmit({
          title: values.title,
          message: values.message,
          type: values.type,
          recipientAdminId: values.recipientAdminId || undefined,
        })
      }
    >
      <FormSection title="Notification">
        <TextField<NotificationFormValues>
          name="title"
          label="Title"
          required
          placeholder="Scheduled maintenance"
        />
        <TextareaField<NotificationFormValues>
          name="message"
          label="Message"
          rows={5}
          placeholder="What the recipient needs to know…"
        />
        <FieldGroup>
          <TextField<NotificationFormValues>
            name="type"
            label="Type"
            required
            placeholder="system"
          />
          <TextField<NotificationFormValues>
            name="recipientAdminId"
            label="Recipient admin ID"
            placeholder="Leave blank to broadcast to all admins"
          />
        </FieldGroup>
      </FormSection>

      <FormActions
        submitLabel={notification ? 'Save changes' : 'Create notification'}
        onCancel={onCancel}
        requireDirty={Boolean(notification)}
      />
    </Form>
  )
}
