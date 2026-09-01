import { z } from 'zod'

import {
  FieldGroup,
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
import {
  SUPPORT_TICKET_PRIORITY_OPTIONS,
  SUPPORT_TICKET_STATUS_OPTIONS,
  type CreateSupportTicketDto,
  type SupportTicket,
} from '../types'

const supportTicketSchema = z.object({
  subject: requiredString('Enter a subject.').max(200, 'Must be 200 characters or fewer.'),
  description: z.string().trim().max(4000, 'Must be 4000 characters or fewer.'),
  category: requiredString('Enter a category.').max(80, 'Must be 80 characters or fewer.'),
  priority: z.string().min(1, 'Choose a priority.'),
  status: z.string().min(1, 'Choose a status.'),
  userId: z.string().trim().max(80, 'Must be 80 characters or fewer.'),
  userName: z.string().trim().max(120, 'Must be 120 characters or fewer.'),
  userEmail: z.string().trim().max(160, 'Must be 160 characters or fewer.'),
  assignedToId: z.string().trim().max(80, 'Must be 80 characters or fewer.'),
})

export type SupportTicketFormValues = z.infer<typeof supportTicketSchema>

interface SupportTicketFormProps {
  /** Omit to create. */
  ticket?: SupportTicket
  onSubmit: (values: CreateSupportTicketDto) => Promise<unknown>
  onCancel: () => void
}

export function SupportTicketForm({ ticket, onSubmit, onCancel }: SupportTicketFormProps) {
  const form = useAppForm<SupportTicketFormValues>({
    schema: supportTicketSchema,
    defaultValues: {
      subject: ticket?.subject ?? '',
      // The API returns `null` for unset optionals; inputs need strings.
      description: ticket?.description ?? '',
      category: ticket?.category ?? '',
      priority: ticket?.priority ?? 'MEDIUM',
      status: ticket?.status ?? 'NEW',
      userId: ticket?.userId ?? '',
      userName: ticket?.userName ?? '',
      userEmail: ticket?.userEmail ?? '',
      assignedToId: ticket?.assignedToId ?? '',
    },
  })

  return (
    <Form
      form={form}
      mapError={resolveAuthError}
      onSubmit={(values) =>
        onSubmit({
          subject: values.subject,
          category: values.category,
          description: values.description || undefined,
          priority: values.priority as CreateSupportTicketDto['priority'],
          status: values.status as CreateSupportTicketDto['status'],
          userId: values.userId || undefined,
          userName: values.userName || undefined,
          userEmail: values.userEmail || undefined,
          assignedToId: values.assignedToId || undefined,
        })
      }
    >
      <FormSection title="Ticket">
        <TextField<SupportTicketFormValues>
          name="subject"
          label="Subject"
          required
          placeholder="Cannot reset my password"
        />

        <TextareaField<SupportTicketFormValues>
          name="description"
          label="Description"
          rows={5}
          placeholder="What's going on?"
        />

        <FieldGroup>
          <TextField<SupportTicketFormValues>
            name="category"
            label="Category"
            required
            placeholder="Billing"
          />
          <SelectField<SupportTicketFormValues>
            name="priority"
            label="Priority"
            required
            options={SUPPORT_TICKET_PRIORITY_OPTIONS}
          />
        </FieldGroup>

        <SelectField<SupportTicketFormValues>
          name="status"
          label="Status"
          required
          options={SUPPORT_TICKET_STATUS_OPTIONS}
        />
      </FormSection>

      <FormSection
        title="Requester"
        description="Who this ticket is about, and who it's assigned to. All optional."
      >
        <FieldGroup>
          <TextField<SupportTicketFormValues> name="userName" label="User name" />
          <TextField<SupportTicketFormValues> name="userEmail" label="User email" />
        </FieldGroup>

        <FieldGroup>
          <TextField<SupportTicketFormValues> name="userId" label="User ID" />
          <TextField<SupportTicketFormValues> name="assignedToId" label="Assigned to (ID)" />
        </FieldGroup>
      </FormSection>

      <FormActions
        submitLabel={ticket ? 'Save changes' : 'Create ticket'}
        onCancel={onCancel}
        requireDirty={Boolean(ticket)}
      />
    </Form>
  )
}
