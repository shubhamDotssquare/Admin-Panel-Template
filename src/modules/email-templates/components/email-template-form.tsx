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
import { requiredString } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import {
  EMAIL_TEMPLATE_STATUS_OPTIONS,
  type CreateEmailTemplateDto,
  type EmailTemplate,
} from '../types'

const emailTemplateSchema = z.object({
  name: requiredString('Enter a name.'),
  // Uppercase/underscore convention (e.g. WELCOME_EMAIL) is hinted, not enforced —
  // the API remains the source of truth for what makes a valid key.
  key: requiredString('Enter a key.'),
  subject: requiredString('Enter a subject.'),
  body: z.string(),
  // Held as comma-separated text while editing; split into an array once, on
  // submit — the same "text in the form, structured on submit" shape as a
  // JSON field, just with a plain comma split instead of `JSON.parse`.
  variables: z.string(),
  status: z.string().min(1, 'Choose a status.'),
})

export type EmailTemplateFormValues = z.infer<typeof emailTemplateSchema>

interface EmailTemplateFormProps {
  /** Omit to create. */
  template?: EmailTemplate
  onSubmit: (values: CreateEmailTemplateDto) => Promise<unknown>
  onCancel: () => void
}

export function EmailTemplateForm({ template, onSubmit, onCancel }: EmailTemplateFormProps) {
  const form = useAppForm<EmailTemplateFormValues>({
    schema: emailTemplateSchema,
    defaultValues: {
      name: template?.name ?? '',
      key: template?.key ?? '',
      subject: template?.subject ?? '',
      body: template?.body ?? '',
      variables: template?.variables?.join(', ') ?? '',
      status: template?.status ?? 'DRAFT',
    },
  })

  return (
    <Form
      form={form}
      mapError={resolveAuthError}
      onSubmit={(values) =>
        onSubmit({
          name: values.name,
          key: values.key,
          subject: values.subject,
          body: values.body || undefined,
          // Parsed once, on submit, from the comma-separated text above.
          variables: values.variables
            .split(',')
            .map((variable) => variable.trim())
            .filter(Boolean),
          status: values.status as CreateEmailTemplateDto['status'],
        })
      }
    >
      <FormSection title="Template">
        <FieldGroup>
          <TextField<EmailTemplateFormValues>
            name="name"
            label="Name"
            required
            placeholder="Welcome email"
          />
          <TextField<EmailTemplateFormValues>
            name="key"
            label="Key"
            required
            placeholder="WELCOME_EMAIL"
            hint="Uppercase letters, digits and underscores by convention, e.g. WELCOME_EMAIL."
          />
        </FieldGroup>

        <TextField<EmailTemplateFormValues>
          name="subject"
          label="Subject"
          required
          placeholder="Welcome to {{appName}}!"
        />

        <TextareaField<EmailTemplateFormValues>
          name="body"
          label="Body"
          rows={12}
          placeholder="Hi {{name}}, …"
        />

        <SelectField<EmailTemplateFormValues>
          name="status"
          label="Status"
          required
          options={EMAIL_TEMPLATE_STATUS_OPTIONS}
        />
      </FormSection>

      <FormSection
        title="Variables"
        description="Placeholder names this template's body may reference."
      >
        <TextareaField<EmailTemplateFormValues>
          name="variables"
          label="Variables"
          rows={2}
          placeholder="name, appName"
          hint={'Comma-separated, e.g. "name, appName".'}
        />
      </FormSection>

      <FormActions
        submitLabel={template ? 'Save changes' : 'Create template'}
        onCancel={onCancel}
        requireDirty={Boolean(template)}
      />
    </Form>
  )
}
