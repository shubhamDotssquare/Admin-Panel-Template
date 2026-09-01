import { z } from 'zod'

import { Modal } from '@/components/common/modal'
import { FieldGroup, Form, FormActions, TextField, useAppForm } from '@/components/form'
import { requiredString } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import { notify } from '@/utils/toast'
import { revenueAnalytics } from '../services/revenue-analytics.queries'
import type { RevenueSnapshot } from '../types'

const revenueSchema = z.object({
  month: requiredString('Enter a month.').regex(
    /^\d{4}-(0[1-9]|1[0-2])$/,
    'Use YYYY-MM format, e.g. 2026-08.',
  ),
  // Numbers stay strings in form state; converted to `Number` on submit.
  revenue: requiredString('Enter revenue.').regex(/^\d+(\.\d+)?$/, 'Enter a valid number.'),
  users: requiredString('Enter users.').regex(/^\d+$/, 'Enter a whole number.'),
  newUsers: requiredString('Enter new users.').regex(/^\d+$/, 'Enter a whole number.'),
})

type RevenueValues = z.infer<typeof revenueSchema>

interface RevenueEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Omit to create. */
  entity?: RevenueSnapshot
}

/** Create or edit one month's revenue snapshot. */
export function RevenueEditorModal({ open, onOpenChange, entity }: RevenueEditorModalProps) {
  const isEdit = Boolean(entity)

  const create = revenueAnalytics.useCreate()
  const update = revenueAnalytics.useUpdate()

  const form = useAppForm<RevenueValues>({
    schema: revenueSchema,
    values: {
      month: entity?.month ?? '',
      revenue: entity ? String(entity.revenue) : '',
      users: entity ? String(entity.users) : '',
      newUsers: entity ? String(entity.newUsers) : '',
    },
  })

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${entity?.month}` : 'New revenue snapshot'}
      description={
        isEdit
          ? "Update this month's revenue and user counts."
          : 'Record revenue and user counts for a month.'
      }
    >
      <Form
        form={form}
        mapError={resolveAuthError}
        onSubmit={async (values) => {
          const payload = {
            month: values.month,
            revenue: Number(values.revenue),
            users: Number(values.users),
            newUsers: Number(values.newUsers),
          }

          if (isEdit && entity) {
            await update.mutateAsync({ id: entity.id, payload })
            notify.success('Revenue snapshot updated')
          } else {
            await create.mutateAsync(payload)
            notify.success('Revenue snapshot created')
          }

          onOpenChange(false)
        }}
      >
        <TextField<RevenueValues>
          name="month"
          label="Month"
          required
          placeholder="2026-08"
          hint="Format: YYYY-MM."
        />

        <FieldGroup columns={3}>
          <TextField<RevenueValues>
            name="revenue"
            label="Revenue"
            type="number"
            required
            placeholder="12000"
          />
          <TextField<RevenueValues>
            name="users"
            label="Users"
            type="number"
            required
            placeholder="500"
          />
          <TextField<RevenueValues>
            name="newUsers"
            label="New users"
            type="number"
            required
            placeholder="80"
          />
        </FieldGroup>

        <FormActions
          submitLabel={isEdit ? 'Save changes' : 'Create snapshot'}
          onCancel={() => onOpenChange(false)}
        />
      </Form>
    </Modal>
  )
}

export default RevenueEditorModal
