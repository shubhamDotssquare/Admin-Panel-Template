import { ArrowLeft, KeyRound } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'

import { AuthCard } from '@/components/common/auth-card'
import { Form, FormActions, TextField, useAppForm } from '@/components/form'
import { Button } from '@/components/ui/button'
import { appConfig } from '@/config/app.config'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { passwordSchema, withMatchingFields } from '@/lib/zod-schemas'
import { PATHS } from '@/router/paths'
import { authService } from '@/services/auth.service'
import { resolveAuthError } from '@/services/auth-error'

const resetPasswordSchema = withMatchingFields(
  z.object({
    newPassword: passwordSchema({ requiredMessage: 'Choose a new password.' }),
    confirmPassword: z.string().min(1, 'Re-enter the new password.'),
  }),
  'newPassword',
  'confirmPassword',
)

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

/**
 * Sets a new password from an emailed link.
 *
 * Succeeding revokes **every** session for the account, so there is no attempt to
 * keep the user signed in — the only way forward is a fresh sign-in.
 */
export function ResetPasswordPage() {
  useDocumentTitle('Reset password')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get(appConfig.auth.resetTokenParam)

  const { passwordMinLength, passwordMaxLength } = appConfig.auth

  const form = useAppForm<ResetPasswordValues>({
    schema: resetPasswordSchema,
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const backToSignIn = (
    <Link
      to={PATHS.auth.login}
      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" aria-hidden="true" />
      Back to sign in
    </Link>
  )

  if (!token) {
    return (
      <AuthCard
        icon={KeyRound}
        title="Link is not valid"
        description="This password reset link is incomplete or has expired."
        footer={backToSignIn}
      >
        <Button asChild variant="outline" className="w-full">
          <Link to={PATHS.auth.forgotPassword}>Request a new link</Link>
        </Button>
      </AuthCard>
    )
  }

  if (form.formState.isSubmitSuccessful) {
    return (
      <AuthCard
        icon={KeyRound}
        title="Password updated"
        description="For your security this signed you out on every device. Sign in with your new password to continue."
      >
        <Button
          onClick={() => navigate(PATHS.auth.login, { replace: true })}
          className="w-full"
        >
          Continue to sign in
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      icon={KeyRound}
      title="Choose a new password"
      description="Pick something you have not used before."
      footer={backToSignIn}
    >
      <Form
        form={form}
        onSubmit={(values) =>
          authService.resetPassword({ token, newPassword: values.newPassword })
        }
        mapError={resolveAuthError}
      >
        <TextField<ResetPasswordValues>
          name="newPassword"
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          hint={`${passwordMinLength}–${passwordMaxLength} characters, with upper and lower case, a number and a symbol.`}
        />

        <TextField<ResetPasswordValues>
          name="confirmPassword"
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
        />

        <FormActions submitLabel="Update password" submittingLabel="Updating…" fullWidth />
      </Form>
    </AuthCard>
  )
}

export default ResetPasswordPage
