import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { FormMessage } from '@/components/common/form-message'
import { LoadingScreen } from '@/components/common/loading-screen'
import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import {
  FieldGroup,
  Form,
  FormActions,
  FormSection,
  SwitchField,
  TextField,
  useAppForm,
} from '@/components/form'
import { usePermission } from '@/hooks/use-permission'
import { createQueryKeys } from '@/lib/query-keys'
import { emailSchema, requiredString } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import { httpClient } from '@/services/http-client'
import { PERMISSIONS } from '@/types/rbac.types'
import type { AppSettings, UpdateAppSettingsDto } from '@/types/settings.types'
import { notify } from '@/utils/toast'

/**
 * `/settings` is a singleton — one global row, not a collection — so this is a
 * bare `useQuery`/`useMutation` pair rather than `createResourceQueries`, which
 * assumes a list/detail REST shape this endpoint does not have.
 */
const settingsKeys = createQueryKeys('app-settings')

function useAppSettings() {
  return useQuery({
    queryKey: settingsKeys.all(),
    queryFn: () => httpClient.get<AppSettings>('/settings'),
  })
}

function useUpdateAppSettings() {
  return useMutation({
    mutationFn: (payload: UpdateAppSettingsDto) =>
      httpClient.patch<AppSettings>('/settings', payload),
    // No `:id` to key on — the whole singleton is potentially stale.
    meta: { invalidates: [settingsKeys.all()] },
  })
}

const generalSettingsSchema = z.object({
  appName: requiredString('Enter an app name.'),
  supportEmail: emailSchema,
  timezone: requiredString('Enter a timezone.'),
  currency: requiredString('Enter a currency.'),
  language: requiredString('Enter a language.'),
  maintenanceMode: z.boolean(),
  registrationEnabled: z.boolean(),
  emailVerificationRequired: z.boolean(),
})

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>

interface GeneralSettingsFormProps {
  settings: AppSettings
  /** Whether the signed-in admin may save changes. */
  canUpdate: boolean
}

function GeneralSettingsForm({ settings, canUpdate }: GeneralSettingsFormProps) {
  const update = useUpdateAppSettings()

  const form = useAppForm<GeneralSettingsValues>({
    schema: generalSettingsSchema,
    defaultValues: {
      appName: settings.appName,
      supportEmail: settings.supportEmail,
      timezone: settings.timezone,
      currency: settings.currency,
      language: settings.language,
      maintenanceMode: settings.maintenanceMode,
      registrationEnabled: settings.registrationEnabled,
      emailVerificationRequired: settings.emailVerificationRequired,
    },
  })

  return (
    <Form
      form={form}
      className="max-w-2xl"
      mapError={resolveAuthError}
      onSubmit={async (values) => {
        const updated = await update.mutateAsync(values)
        notify.success('Settings updated')
        form.reset({
          appName: updated.appName,
          supportEmail: updated.supportEmail,
          timezone: updated.timezone,
          currency: updated.currency,
          language: updated.language,
          maintenanceMode: updated.maintenanceMode,
          registrationEnabled: updated.registrationEnabled,
          emailVerificationRequired: updated.emailVerificationRequired,
        })
      }}
    >
      <FormSection
        title="Application"
        description="Basic identity, shown to admins and used in system emails."
      >
        <FieldGroup>
          <TextField<GeneralSettingsValues>
            name="appName"
            label="App name"
            required
            disabled={!canUpdate}
          />
          <TextField<GeneralSettingsValues>
            name="supportEmail"
            label="Support email"
            type="email"
            required
            disabled={!canUpdate}
          />
        </FieldGroup>

        <FieldGroup columns={3}>
          <TextField<GeneralSettingsValues>
            name="timezone"
            label="Timezone"
            required
            placeholder="UTC"
            disabled={!canUpdate}
          />
          <TextField<GeneralSettingsValues>
            name="currency"
            label="Currency"
            required
            placeholder="USD"
            disabled={!canUpdate}
          />
          <TextField<GeneralSettingsValues>
            name="language"
            label="Language"
            required
            placeholder="en"
            disabled={!canUpdate}
          />
        </FieldGroup>
      </FormSection>

      <FormSection
        title="Access"
        description="Controls that take effect for every admin and end user immediately."
      >
        <SwitchField<GeneralSettingsValues>
          name="maintenanceMode"
          label="Maintenance mode"
          hint="Blocks sign-in for everyone except super admins."
          disabled={!canUpdate}
        />
        <SwitchField<GeneralSettingsValues>
          name="registrationEnabled"
          label="Allow registration"
          hint="Lets new users create their own accounts."
          disabled={!canUpdate}
        />
        <SwitchField<GeneralSettingsValues>
          name="emailVerificationRequired"
          label="Require email verification"
          hint="New accounts must confirm their email before signing in."
          disabled={!canUpdate}
        />
      </FormSection>

      {canUpdate ? (
        <FormActions submitLabel="Save changes" submittingLabel="Saving…" requireDirty />
      ) : (
        <p className="text-caption text-muted-foreground">
          You do not have permission to change these settings.
        </p>
      )}
    </Form>
  )
}

/**
 * Application-wide settings: identity fields plus the switches that affect
 * every admin and end user at once.
 *
 * Unlike the change-password and devices screens, this reads and writes a
 * single server-side record rather than acting on the signed-in admin's own
 * account — so the page fetches before it can render anything meaningful, and
 * shows a loading state in between.
 */
export function GeneralSettingsPage() {
  const canUpdate = usePermission(PERMISSIONS.settingsUpdate)
  const { data, isLoading, isError, error } = useAppSettings()

  return (
    <PageContainer>
      <PageHeader title="General" description="Application identity and access defaults." />

      {isLoading ? (
        <LoadingScreen label="Loading settings…" />
      ) : isError || !data ? (
        <FormMessage>{resolveAuthError(error).message}</FormMessage>
      ) : (
        <GeneralSettingsForm settings={data} canUpdate={canUpdate} />
      )}
    </PageContainer>
  )
}

export default GeneralSettingsPage
