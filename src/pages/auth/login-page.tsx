import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'

import { AuthCard } from '@/components/common/auth-card'
import { FormMessage } from '@/components/common/form-message'
import { Form, FormActions, TextField, useAppForm } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { appConfig } from '@/config/app.config'
import { useAuth } from '@/hooks/use-auth'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { emailSchema, requiredString } from '@/lib/zod-schemas'
import { PATHS } from '@/router/paths'
import { authService } from '@/services/auth.service'
import { resolveAuthError } from '@/services/auth-error'

const loginSchema = z.object({
  email: emailSchema,
  password: requiredString('Enter your password.'),
})

type LoginValues = z.infer<typeof loginSchema>

/**
 * Sign-in screen.
 *
 * Failure handling is entirely code-driven: `resolveAuthError` supplies the copy
 * and an action, so `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `ACCOUNT_INACTIVE`
 * and `EMAIL_NOT_VERIFIED` are all handled without a branch per code here.
 */
export function LoginPage() {
  useDocumentTitle('Sign in')

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Set when the server says the address is unverified, which is the only
  // situation where offering a resend makes sense.
  const [canResend, setCanResend] = useState(false)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  const form = useAppForm<LoginValues>({
    schema: loginSchema,
    defaultValues: { email: '', password: '' },
  })

  const handleResend = async (): Promise<void> => {
    setResendState('sending')
    try {
      await authService.resendVerification(form.getValues('email'))
    } finally {
      // Always 200 by design, and a failure here must not contradict the
      // deliberately non-committal copy below.
      setResendState('sent')
    }
  }

  return (
    <AuthCard
      icon={LogIn}
      title="Sign in"
      description={`Enter your credentials to access ${appConfig.name}.`}
      footer={
        <span className="text-muted-foreground">
          Need an account?{' '}
          <Link to={PATHS.auth.register} className="text-primary hover:underline">
            Create one
          </Link>
        </span>
      }
    >
      <Form
        form={form}
        onSubmit={async (values) => {
          setCanResend(false)
          setResendState('idle')

          await signIn(values)

          const redirectTo = searchParams.get(appConfig.auth.redirectParam)
          navigate(redirectTo ?? appConfig.homePath, { replace: true })
        }}
        mapError={(error) => {
          const resolved = resolveAuthError(error)
          // The only failure that earns an extra control on this screen.
          setCanResend(resolved.action === 'resendVerification')
          return resolved
        }}
      >
        {!appConfig.auth.enabled && (
          <FormMessage tone="info">
            Authentication is disabled. Set{' '}
            <code className="font-mono">VITE_AUTH_ENABLED=true</code> to activate this form.
          </FormMessage>
        )}

        {canResend && resendState !== 'sent' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleResend()}
            disabled={resendState === 'sending'}
          >
            {resendState === 'sending' && <Spinner size="sm" />}
            Resend verification email
          </Button>
        )}

        {resendState === 'sent' && (
          <FormMessage tone="success">
            If that address needs verifying, a new link is on its way.
          </FormMessage>
        )}

        <TextField<LoginValues>
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          autoFocus
        />

        <TextField<LoginValues>
          name="password"
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          action={
            <Link
              to={PATHS.auth.forgotPassword}
              className="text-caption text-primary hover:underline"
            >
              Forgot password?
            </Link>
          }
        />

        <FormActions submitLabel="Sign in" submittingLabel="Signing in…" fullWidth />
      </Form>
    </AuthCard>
  )
}

export default LoginPage
