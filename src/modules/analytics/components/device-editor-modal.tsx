import { z } from 'zod'

import { Modal } from '@/components/common/modal'
import { FieldGroup, Form, FormActions, TextField, useAppForm } from '@/components/form'
import { requiredString } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import { notify } from '@/utils/toast'
import { deviceAnalytics } from '../services/device-analytics.queries'
import type { DeviceAnalytic } from '../types'

const deviceSchema = z.object({
  device: requiredString('Enter a device.').max(120, 'Must be 120 characters or fewer.'),
  // Optional: stays a string in form state, blank means "not set".
  users: z.string().regex(/^\d*$/, 'Enter a whole number.'),
})

type DeviceValues = z.infer<typeof deviceSchema>

interface DeviceEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Omit to create. */
  entity?: DeviceAnalytic
}

/** Create or edit one device type's user count. */
export function DeviceEditorModal({ open, onOpenChange, entity }: DeviceEditorModalProps) {
  const isEdit = Boolean(entity)

  const create = deviceAnalytics.useCreate()
  const update = deviceAnalytics.useUpdate()

  const form = useAppForm<DeviceValues>({
    schema: deviceSchema,
    values: {
      device: entity?.device ?? '',
      users: entity ? String(entity.users) : '',
    },
  })

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${entity?.device}` : 'New device'}
      description={isEdit ? "Update this device's user count." : 'Record users for a device.'}
    >
      <Form
        form={form}
        mapError={resolveAuthError}
        onSubmit={async (values) => {
          const payload = {
            device: values.device,
            users: values.users === '' ? undefined : Number(values.users),
          }

          if (isEdit && entity) {
            await update.mutateAsync({ id: entity.id, payload })
            notify.success('Device updated')
          } else {
            await create.mutateAsync(payload)
            notify.success('Device created')
          }

          onOpenChange(false)
        }}
      >
        <FieldGroup>
          <TextField<DeviceValues> name="device" label="Device" required placeholder="Mobile" />
          <TextField<DeviceValues> name="users" label="Users" type="number" placeholder="500" />
        </FieldGroup>

        <FormActions
          submitLabel={isEdit ? 'Save changes' : 'Create device'}
          onCancel={() => onOpenChange(false)}
        />
      </Form>
    </Modal>
  )
}

export default DeviceEditorModal
