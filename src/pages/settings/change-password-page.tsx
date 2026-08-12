import { useNavigate } from 'react-router'
import { z } from 'zod'

import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import {
  Form,
  FormActions,
  FormSection,
  SwitchField,
  TextField,
  useAppForm,
} from '@/components/form'
import { Button } from '@/components/ui/button'
import { appConfig } from '@/config/app.config'
import { useAuth } from '@/hooks/use-auth'
import { passwordSchema, withMatchingFields } from '@/lib/zod-schemas'
import { PATHS } from '@/router/paths'
import { resolveAuthError } from '@/services/auth-error'
import { authService } from '@/services/auth.service'
import { notify } from '@/utils/toast'

const changePasswordSchema = withMatchingFields(
  z.object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: passwordSchema({ requiredMessage: 'Choose a new password.' }),
    confirmPassword: z.string().min(1, 'Re-enter the new password.'),
    revokeOtherSessions: z.boolean(),
  }),
  'newPassword',
  'confirmPassword',
)

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

/**
 * Change the signed-in user's password.
 *
 * Revoking other sessions defaults to on, matching the server's own default and
 * the safer reading of "I am changing my password" — usually prompted by a
 * suspicion the old one leaked.
 */
export function ChangePasswordPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const { passwordMinLength, passwordMaxLength } = appConfig.auth

  const form = useAppForm<ChangePasswordValues>({
    schema: changePasswordSchema,
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      revokeOtherSessions: true,
    },
  })

  return (
    <PageContainer>
      <PageHeader
        title="Change password"
        description="Update the password used to sign in to your account."
      />

      <Form
        form={form}
        className="max-w-xl"
        onSubmit={async (values) => {
          const result = await authService.changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            revokeOtherSessions: values.revokeOtherSessions,
          })

          const revoked = result?.revokedSessions ?? 0
          notify.success(
            'Password updated',
            revoked > 0
              ? {
                  description: `Signed out of ${revoked} other ${revoked === 1 ? 'device' : 'devices'}.`,
                }
              : undefined,
          )

          form.reset()
        }}
        // A wrong current password comes back 401 and PASSWORD_REUSED comes back
        // 422 on `newPassword`; the resolver places the latter without help.
        mapError={(error) => {
          const resolved = resolveAuthError(error)

          // 401 here means the *current* password was wrong, not that the
          // session died — say so on the field rather than letting it read as a
          // sign-out.
          if (resolved.code === 'INVALID_CREDENTIALS') {
            return {
              message: resolved.message,
              fieldErrors: { currentPassword: ['That is not your current password.'] },
            }
          }

          return resolved
        }}
      >
        <FormSection title="New password">
          <TextField<ChangePasswordValues>
            name="currentPassword"
            label="Current password"
            type="password"
            required
            autoComplete="current-password"
          />

          <TextField<ChangePasswordValues>
            name="newPassword"
            label="New password"
            type="password"
            required
            autoComplete="new-password"
            hint={`${passwordMinLength}–${passwordMaxLength} characters, with upper and lower case, a number and a symbol.`}
          />

          <TextField<ChangePasswordValues>
            name="confirmPassword"
            label="Confirm new password"
            type="password"
            required
            autoComplete="new-password"
          />

          <SwitchField<ChangePasswordValues>
            name="revokeOtherSessions"
            label="Sign out other devices"
            hint="Ends every other active session. Recommended if you suspect your password was exposed."
          />
        </FormSection>

        <FormActions submitLabel="Update password" submittingLabel="Updating…">
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              await signOut()
              navigate(PATHS.auth.login, { replace: true })
            }}
          >
            Sign out
          </Button>
        </FormActions>
      </Form>
    </PageContainer>
  )
}

export default ChangePasswordPage
