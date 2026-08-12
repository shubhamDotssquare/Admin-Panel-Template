import { z } from 'zod'

import {
  FieldGroup,
  Form,
  FormActions,
  FormSection,
  MultiSelectField,
  SelectField,
  TextField,
  TextareaField,
  useAppForm,
} from '@/components/form'
import { emailSchema, requiredString } from '@/lib/zod-schemas'
import type { CreateUserDto, User } from '../types'
import { USER_GROUP_OPTIONS, USER_STATUS_OPTIONS } from '../types'

const userSchema = z.object({
  firstName: requiredString('Enter a first name.').max(80, 'Must be 80 characters or fewer.'),
  lastName: requiredString('Enter a last name.').max(80, 'Must be 80 characters or fewer.'),
  email: emailSchema,
  phone: z.string().trim().max(32, 'Must be 32 characters or fewer.'),
  status: requiredString('Choose a status.'),
  groups: z.array(z.string()),
  notes: z.string().trim().max(500, 'Keep notes under 500 characters.'),
})

export type UserFormValues = z.infer<typeof userSchema>

interface UserFormProps {
  /** Omit to create. Supplying a record switches the form to edit. */
  user?: User
  onSubmit: (values: CreateUserDto) => Promise<unknown>
  onCancel: () => void
  submitLabel?: string
}

/**
 * One form for both create and edit.
 *
 * The two screens differ only in defaults and copy, so sharing the form is what
 * stops the "add" and "edit" versions of a record drifting apart — a class of
 * bug that is invisible until someone edits a field that create never set.
 */
export function UserForm({ user, onSubmit, onCancel, submitLabel }: UserFormProps) {
  const form = useAppForm<UserFormValues>({
    schema: userSchema,
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      // The API returns `null` for unset optionals; the form needs strings.
      phone: user?.phone ?? '',
      status: user?.status ?? 'PENDING',
      groups: user?.groups ?? [],
      notes: user?.notes ?? '',
    },
  })

  return (
    <Form
      form={form}
      onSubmit={(values) =>
        onSubmit({
          ...values,
          status: values.status as CreateUserDto['status'],
          // Send omissions rather than empty strings, so the API stores null.
          phone: values.phone || undefined,
          notes: values.notes || undefined,
        })
      }
    >
      <FormSection title="Identity" description="How this person appears across the panel.">
        <FieldGroup>
          <TextField<UserFormValues>
            name="firstName"
            label="First name"
            required
            autoFocus
            placeholder="Ada"
          />
          <TextField<UserFormValues>
            name="lastName"
            label="Last name"
            required
            placeholder="Lovelace"
          />
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
      </FormSection>

      <FormSection title="Access" description="Status and group membership.">
        <FieldGroup>
          <SelectField<UserFormValues>
            name="status"
            label="Status"
            required
            options={USER_STATUS_OPTIONS}
          />
          <MultiSelectField<UserFormValues>
            name="groups"
            label="Groups"
            options={USER_GROUP_OPTIONS}
            placeholder="No groups"
          />
        </FieldGroup>

        <TextareaField<UserFormValues>
          name="notes"
          label="Internal notes"
          rows={3}
          hint="Visible to your team only."
        />
      </FormSection>

      <FormActions
        submitLabel={submitLabel ?? (user ? 'Save changes' : 'Create user')}
        onCancel={onCancel}
        // Editing without changing anything is a no-op worth preventing;
        // creating starts empty, so the guard would block the first submit.
        requireDirty={Boolean(user)}
      />
    </Form>
  )
}
