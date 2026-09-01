import { z } from 'zod'

import {
  FieldGroup,
  Form,
  FormActions,
  FormSection,
  SelectField,
  TextareaField,
  TextField,
  useAppForm,
} from '@/components/form'
import { emailSchema } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import {
  ENQUIRY_PRIORITY_OPTIONS,
  ENQUIRY_STATUS_OPTIONS,
  type CreateEnquiryDto,
  type Enquiry,
} from '../types'

const enquirySchema = z.object({
  name: z.string().trim().min(1, 'Enter a name.').max(120, 'Must be 120 characters or fewer.'),
  email: emailSchema,
  phone: z.string().trim().max(32, 'Must be 32 characters or fewer.'),
  subject: z
    .string()
    .trim()
    .min(1, 'Enter a subject.')
    .max(200, 'Must be 200 characters or fewer.'),
  category: z
    .string()
    .trim()
    .min(1, 'Enter a category.')
    .max(80, 'Must be 80 characters or fewer.'),
  priority: z.string().min(1, 'Choose a priority.'),
  status: z.string().min(1, 'Choose a status.'),
  source: z.string().trim().max(80, 'Must be 80 characters or fewer.'),
  notes: z.string().trim().max(4000, 'Must be 4000 characters or fewer.'),
  assignedToId: z.string().trim().max(64, 'Must be 64 characters or fewer.'),
})

export type EnquiryFormValues = z.infer<typeof enquirySchema>

interface EnquiryFormProps {
  /** Omit to create. */
  enquiry?: Enquiry
  onSubmit: (values: CreateEnquiryDto) => Promise<unknown>
  onCancel: () => void
}

export function EnquiryForm({ enquiry, onSubmit, onCancel }: EnquiryFormProps) {
  const form = useAppForm<EnquiryFormValues>({
    schema: enquirySchema,
    defaultValues: {
      name: enquiry?.name ?? '',
      email: enquiry?.email ?? '',
      // The API returns `null` for unset optionals; inputs need strings.
      phone: enquiry?.phone ?? '',
      subject: enquiry?.subject ?? '',
      category: enquiry?.category ?? '',
      priority: enquiry?.priority ?? 'MEDIUM',
      status: enquiry?.status ?? 'NEW',
      source: enquiry?.source ?? '',
      notes: enquiry?.notes ?? '',
      assignedToId: enquiry?.assignedToId ?? '',
    },
  })

  return (
    <Form
      form={form}
      mapError={resolveAuthError}
      onSubmit={(values) =>
        onSubmit({
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          subject: values.subject,
          category: values.category,
          priority: values.priority as CreateEnquiryDto['priority'],
          status: values.status as CreateEnquiryDto['status'],
          source: values.source || undefined,
          notes: values.notes || undefined,
          assignedToId: values.assignedToId || undefined,
        })
      }
    >
      <FormSection title="Contact">
        <FieldGroup>
          <TextField<EnquiryFormValues>
            name="name"
            label="Name"
            required
            placeholder="Ada Lovelace"
          />
          <TextField<EnquiryFormValues>
            name="email"
            label="Email"
            type="email"
            required
            placeholder="ada@example.com"
          />
        </FieldGroup>

        <TextField<EnquiryFormValues>
          name="phone"
          label="Phone"
          type="tel"
          placeholder="+44 …"
        />
      </FormSection>

      <FormSection title="Enquiry">
        <FieldGroup>
          <TextField<EnquiryFormValues>
            name="subject"
            label="Subject"
            required
            placeholder="Question about pricing"
          />
          <TextField<EnquiryFormValues>
            name="category"
            label="Category"
            required
            placeholder="Billing"
          />
        </FieldGroup>

        <FieldGroup>
          <SelectField<EnquiryFormValues>
            name="priority"
            label="Priority"
            required
            options={ENQUIRY_PRIORITY_OPTIONS}
          />
          <SelectField<EnquiryFormValues>
            name="status"
            label="Status"
            required
            options={ENQUIRY_STATUS_OPTIONS}
          />
        </FieldGroup>

        <FieldGroup>
          <TextField<EnquiryFormValues>
            name="source"
            label="Source"
            placeholder="Website form"
          />
          <TextField<EnquiryFormValues>
            name="assignedToId"
            label="Assigned to (user ID)"
            placeholder="Optional"
          />
        </FieldGroup>

        <TextareaField<EnquiryFormValues>
          name="notes"
          label="Notes"
          rows={6}
          placeholder="Internal notes about this enquiry…"
        />
      </FormSection>

      <FormActions
        submitLabel={enquiry ? 'Save changes' : 'Create enquiry'}
        onCancel={onCancel}
        requireDirty={Boolean(enquiry)}
      />
    </Form>
  )
}
