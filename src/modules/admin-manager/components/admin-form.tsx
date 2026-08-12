import { z } from 'zod'

import {
  FieldGroup,
  Form,
  FormActions,
  FormSection,
  MultiSelectField,
  SelectField,
  TextField,
  useAppForm,
} from '@/components/form'
import { emailSchema, requiredString } from '@/lib/zod-schemas'
import { useRoleOptions } from '../services/admin.queries'
import { ADMIN_STATUS_OPTIONS, type Admin, type CreateAdminDto } from '../types'

const adminSchema = z.object({
  firstName: requiredString('Enter a first name.').max(80, 'Must be 80 characters or fewer.'),
  lastName: requiredString('Enter a last name.').max(80, 'Must be 80 characters or fewer.'),
  email: emailSchema,
  status: requiredString('Choose a status.'),
  // Access is the point of an administrator; a role-less one can sign in and do
  // nothing, which reads as a broken account rather than a deliberate state.
  roles: z.array(z.string()).min(1, 'Assign at least one role.'),
})

export type AdminFormValues = z.infer<typeof adminSchema>

interface AdminFormProps {
  admin?: Admin
  onSubmit: (values: CreateAdminDto) => Promise<unknown>
  onCancel: () => void
}

/** Create/edit form for a staff account, including role assignment. */
export function AdminForm({ admin, onSubmit, onCancel }: AdminFormProps) {
  const { options: roleOptions, isLoading: isLoadingRoles } = useRoleOptions()

  const form = useAppForm<AdminFormValues>({
    schema: adminSchema,
    defaultValues: {
      firstName: admin?.firstName ?? '',
      lastName: admin?.lastName ?? '',
      email: admin?.email ?? '',
      status: admin?.status ?? 'INVITED',
      roles: admin?.roles ?? [],
    },
  })

  return (
    <Form
      form={form}
      onSubmit={(values) =>
        onSubmit({ ...values, status: values.status as CreateAdminDto['status'] })
      }
    >
      <FormSection title="Identity">
        <FieldGroup>
          <TextField<AdminFormValues>
            name="firstName"
            label="First name"
            required
            autoFocus
            placeholder="Grace"
          />
          <TextField<AdminFormValues>
            name="lastName"
            label="Last name"
            required
            placeholder="Hopper"
          />
        </FieldGroup>

        <TextField<AdminFormValues>
          name="email"
          label="Email"
          type="email"
          required
          placeholder="grace@example.com"
          hint={admin ? undefined : 'An invitation is sent to this address.'}
        />
      </FormSection>

      <FormSection title="Access" description="Roles decide what this administrator can reach.">
        <FieldGroup>
          <SelectField<AdminFormValues>
            name="status"
            label="Status"
            required
            options={ADMIN_STATUS_OPTIONS}
          />
          <MultiSelectField<AdminFormValues>
            name="roles"
            label="Roles"
            required
            options={roleOptions}
            placeholder={isLoadingRoles ? 'Loading roles…' : 'Assign roles'}
            disabled={isLoadingRoles}
          />
        </FieldGroup>
      </FormSection>

      <FormActions
        submitLabel={admin ? 'Save changes' : 'Send invitation'}
        onCancel={onCancel}
        requireDirty={Boolean(admin)}
      />
    </Form>
  )
}
