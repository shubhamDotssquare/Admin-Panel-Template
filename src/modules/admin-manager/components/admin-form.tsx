import { z } from 'zod'

import {
  FieldGroup,
  Form,
  FormActions,
  FormSection,
  SelectField,
  TextField,
  useAppForm,
} from '@/components/form'
import { emailSchema, passwordSchema } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import {
  ADMIN_ROLE_OPTIONS,
  ADMIN_STATUS_OPTIONS,
  type Admin,
  type CreateAdminDto,
  type UpdateAdminDto,
} from '../types'

/**
 * Password is required on create and **absent** on edit.
 *
 * `PATCH /admins/:id` refuses passwords outright, so the edit form must not
 * offer a field the API would reject — resetting someone else's password is a
 * different flow, not a profile edit.
 */
const baseShape = {
  email: emailSchema,
  username: z.string().trim().max(64, 'Must be 64 characters or fewer.'),
  firstName: z.string().trim().max(80, 'Must be 80 characters or fewer.'),
  lastName: z.string().trim().max(80, 'Must be 80 characters or fewer.'),
  phone: z.string().trim().max(32, 'Must be 32 characters or fewer.'),
  role: z.string().min(1, 'Choose a role.'),
  status: z.string().min(1, 'Choose a status.'),
}

const createSchema = z.object({ ...baseShape, password: passwordSchema() })
const editSchema = z.object(baseShape)

type CreateValues = z.infer<typeof createSchema>
type EditValues = z.infer<typeof editSchema>

interface AdminFormProps {
  /** Omit to create. */
  admin?: Admin
  onSubmit: (values: CreateAdminDto | UpdateAdminDto) => Promise<unknown>
  onCancel: () => void
}

export function AdminForm({ admin, onSubmit, onCancel }: AdminFormProps) {
  const isEdit = Boolean(admin)

  const form = useAppForm<CreateValues>({
    // Both shapes share every field but `password`, so one form serves both.
    schema: (isEdit ? editSchema : createSchema) as unknown as typeof createSchema,
    defaultValues: {
      email: admin?.email ?? '',
      // The API returns `null` for unset optionals; inputs need strings.
      username: admin?.username ?? '',
      firstName: admin?.firstName ?? '',
      lastName: admin?.lastName ?? '',
      phone: admin?.phone ?? '',
      role: admin?.role ?? 'USER',
      status: admin?.status ?? 'ACTIVE',
      password: '',
    },
  })

  return (
    <Form
      form={form}
      mapError={resolveAuthError}
      onSubmit={(values) => {
        const shared = {
          email: values.email,
          // Omit blanks rather than sending empty strings the API would store.
          username: values.username || undefined,
          firstName: values.firstName || undefined,
          lastName: values.lastName || undefined,
          phone: values.phone || undefined,
          role: values.role as CreateAdminDto['role'],
          status: values.status as CreateAdminDto['status'],
        }

        return onSubmit(
          isEdit ? shared : ({ ...shared, password: values.password } as CreateAdminDto),
        )
      }}
    >
      <FormSection title="Identity">
        <FieldGroup>
          <TextField<CreateValues> name="firstName" label="First name" placeholder="Grace" />
          <TextField<CreateValues> name="lastName" label="Last name" placeholder="Hopper" />
        </FieldGroup>

        <FieldGroup>
          <TextField<CreateValues>
            name="email"
            label="Email"
            type="email"
            required
            placeholder="grace@example.com"
          />
          <TextField<CreateValues> name="username" label="Username" placeholder="ghopper" />
        </FieldGroup>

        <TextField<CreateValues> name="phone" label="Phone" type="tel" placeholder="+44 …" />
      </FormSection>

      <FormSection
        title="Access"
        description={
          isEdit
            ? 'Assignable roles are managed separately, from this admin’s profile.'
            : 'The account is created immediately. Assign roles once it exists.'
        }
      >
        <FieldGroup>
          <SelectField<CreateValues>
            name="role"
            label="Role tier"
            required
            options={ADMIN_ROLE_OPTIONS}
          />
          <SelectField<CreateValues>
            name="status"
            label="Status"
            required
            options={ADMIN_STATUS_OPTIONS}
          />
        </FieldGroup>

        {!isEdit && (
          <TextField<CreateValues>
            name="password"
            label="Temporary password"
            type="password"
            required
            autoComplete="new-password"
            hint="They should change this after their first sign-in."
          />
        )}
      </FormSection>

      <FormActions
        submitLabel={isEdit ? 'Save changes' : 'Create admin'}
        onCancel={onCancel}
        requireDirty={isEdit}
      />
    </Form>
  )
}

export type { EditValues }
