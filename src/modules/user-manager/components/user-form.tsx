import { z } from 'zod'

import {
  FieldGroup,
  Form,
  FormActions,
  FormSection,
  JsonField,
  SelectField,
  TextField,
  useAppForm,
} from '@/components/form'
import { emailSchema, jsonStringSchema } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import { USER_STATUS_OPTIONS, type CreateUserDto, type User } from '../types'

const userSchema = z.object({
  email: emailSchema,
  firstName: z.string().trim().max(80, 'Must be 80 characters or fewer.'),
  lastName: z.string().trim().max(80, 'Must be 80 characters or fewer.'),
  phone: z.string().trim().max(32, 'Must be 32 characters or fewer.'),
  status: z.string().min(1, 'Choose a status.'),
  // Held as text while editing; parsed once, on submit.
  metadata: jsonStringSchema(),
})

export type UserFormValues = z.infer<typeof userSchema>

interface UserFormProps {
  /** Omit to create. */
  user?: User
  onSubmit: (values: CreateUserDto) => Promise<unknown>
  onCancel: () => void
}

export function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const form = useAppForm<UserFormValues>({
    schema: userSchema,
    defaultValues: {
      email: user?.email ?? '',
      // The API returns `null` for unset optionals; inputs need strings.
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      status: user?.status ?? 'PENDING',
      // Seeded with the *current* object, which is what makes the editor safe:
      // the API replaces metadata wholesale, so submitting anything less than
      // the whole object would silently drop keys.
      metadata: user?.metadata ? JSON.stringify(user.metadata, null, 2) : '',
    },
  })

  return (
    <Form
      form={form}
      mapError={resolveAuthError}
      onSubmit={(values) =>
        onSubmit({
          email: values.email,
          firstName: values.firstName || undefined,
          lastName: values.lastName || undefined,
          phone: values.phone || undefined,
          status: values.status as CreateUserDto['status'],
          // Validated as JSON by the schema, so this cannot throw here.
          metadata: values.metadata.trim()
            ? (JSON.parse(values.metadata) as Record<string, unknown>)
            : undefined,
        })
      }
    >
      <FormSection title="Contact">
        <FieldGroup>
          <TextField<UserFormValues> name="firstName" label="First name" placeholder="Ada" />
          <TextField<UserFormValues> name="lastName" label="Last name" placeholder="Lovelace" />
        </FieldGroup>

        <FieldGroup>
          <TextField<UserFormValues>
            name="email"
            label="Email"
            type="email"
            required
            placeholder="ada@example.com"
          />
          <TextField<UserFormValues>
            name="phone"
            label="Phone"
            type="tel"
            placeholder="+44 …"
          />
        </FieldGroup>

        <SelectField<UserFormValues>
          name="status"
          label="Status"
          required
          options={USER_STATUS_OPTIONS}
        />
      </FormSection>

      <FormSection title="Metadata" description="Free-form JSON stored against this record.">
        <JsonField<UserFormValues>
          name="metadata"
          label="Metadata"
          rows={8}
          hint="Saving replaces the whole object — edit the JSON below rather than sending only what changed."
        />
      </FormSection>

      <FormActions
        submitLabel={user ? 'Save changes' : 'Create user'}
        onCancel={onCancel}
        requireDirty={Boolean(user)}
      />
    </Form>
  )
}
