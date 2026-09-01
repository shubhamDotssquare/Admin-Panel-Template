import { z } from 'zod'

import { Modal } from '@/components/common/modal'
import { FieldGroup, Form, FormActions, TextField, useAppForm } from '@/components/form'
import { requiredString } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import { notify } from '@/utils/toast'
import { locationAnalytics } from '../services/location-analytics.queries'
import type { LocationAnalytic } from '../types'

const locationSchema = z.object({
  country: requiredString('Enter a country.').max(120, 'Must be 120 characters or fewer.'),
  // Optional: stays a string in form state, blank means "not set".
  users: z.string().regex(/^\d*$/, 'Enter a whole number.'),
})

type LocationValues = z.infer<typeof locationSchema>

interface LocationEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Omit to create. */
  entity?: LocationAnalytic
}

/** Create or edit one country's user count. */
export function LocationEditorModal({ open, onOpenChange, entity }: LocationEditorModalProps) {
  const isEdit = Boolean(entity)

  const create = locationAnalytics.useCreate()
  const update = locationAnalytics.useUpdate()

  const form = useAppForm<LocationValues>({
    schema: locationSchema,
    values: {
      country: entity?.country ?? '',
      users: entity ? String(entity.users) : '',
    },
  })

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${entity?.country}` : 'New location'}
      description={
        isEdit ? "Update this country's user count." : 'Record users for a country.'
      }
    >
      <Form
        form={form}
        mapError={resolveAuthError}
        onSubmit={async (values) => {
          const payload = {
            country: values.country,
            users: values.users === '' ? undefined : Number(values.users),
          }

          if (isEdit && entity) {
            await update.mutateAsync({ id: entity.id, payload })
            notify.success('Location updated')
          } else {
            await create.mutateAsync(payload)
            notify.success('Location created')
          }

          onOpenChange(false)
        }}
      >
        <FieldGroup>
          <TextField<LocationValues>
            name="country"
            label="Country"
            required
            placeholder="United States"
          />
          <TextField<LocationValues> name="users" label="Users" type="number" placeholder="500" />
        </FieldGroup>

        <FormActions
          submitLabel={isEdit ? 'Save changes' : 'Create location'}
          onCancel={() => onOpenChange(false)}
        />
      </Form>
    </Modal>
  )
}

export default LocationEditorModal
