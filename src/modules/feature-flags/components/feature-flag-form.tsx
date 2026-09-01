import { z } from 'zod'

import {
  FieldGroup,
  Form,
  FormActions,
  FormSection,
  SwitchField,
  TextField,
  TextareaField,
  useAppForm,
} from '@/components/form'
import { requiredString } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import type { CreateFeatureFlagDto, FeatureFlag } from '../types'

const featureFlagSchema = z.object({
  key: requiredString('Enter a key.')
    .max(80, 'Must be 80 characters or fewer.')
    .regex(/^[A-Za-z0-9_.-]+$/, 'Use letters, numbers, underscores, dots or hyphens only.'),
  name: requiredString('Enter a name.').max(120, 'Must be 120 characters or fewer.'),
  description: z.string().trim().max(500, 'Must be 500 characters or fewer.'),
  enabled: z.boolean(),
})

export type FeatureFlagFormValues = z.infer<typeof featureFlagSchema>

interface FeatureFlagFormProps {
  /** Omit to create. */
  featureFlag?: FeatureFlag
  onSubmit: (values: CreateFeatureFlagDto) => Promise<unknown>
  onCancel: () => void
}

export function FeatureFlagForm({ featureFlag, onSubmit, onCancel }: FeatureFlagFormProps) {
  const form = useAppForm<FeatureFlagFormValues>({
    schema: featureFlagSchema,
    defaultValues: {
      key: featureFlag?.key ?? '',
      name: featureFlag?.name ?? '',
      description: featureFlag?.description ?? '',
      enabled: featureFlag?.enabled ?? false,
    },
  })

  return (
    <Form
      form={form}
      mapError={resolveAuthError}
      onSubmit={(values) =>
        onSubmit({
          key: values.key,
          name: values.name,
          description: values.description || undefined,
          enabled: values.enabled,
        })
      }
    >
      <FormSection title="Feature flag">
        <FieldGroup>
          <TextField<FeatureFlagFormValues>
            name="key"
            label="Key"
            required
            placeholder="NEW_CHECKOUT_FLOW"
          />
          <TextField<FeatureFlagFormValues>
            name="name"
            label="Name"
            required
            placeholder="New checkout flow"
          />
        </FieldGroup>

        <TextareaField<FeatureFlagFormValues>
          name="description"
          label="Description"
          rows={4}
          placeholder="What this flag controls…"
        />

        <SwitchField<FeatureFlagFormValues> name="enabled" label="Enabled" />
      </FormSection>

      <FormActions
        submitLabel={featureFlag ? 'Save changes' : 'Create feature flag'}
        onCancel={onCancel}
        requireDirty={Boolean(featureFlag)}
      />
    </Form>
  )
}
