import { ArrowLeft, MailQuestion } from 'lucide-react'
import { Link } from 'react-router'
import { z } from 'zod'

import { AuthCard } from '@/components/common/auth-card'
import { FormMessage } from '@/components/common/form-message'
import { Form, FormActions, TextField, useAppForm } from '@/components/form'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { emailSchema } from '@/lib/zod-schemas'
import { PATHS } from '@/router/paths'
import { authService } from '@/services/auth.service'
import { resolveAuthError } from '@/services/auth-error'

const forgotPasswordSchema = z.object({ email: emailSchema })
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

/**
 * Requests a reset link.
 *
 * The confirmation is deliberately vague about whether the address exists —
 * saying so would turn this screen into an account-enumeration oracle.
 */
export function ForgotPasswordPage() {
  useDocumentTitle('Forgot password')

  const form = useAppForm<ForgotPasswordValues>({
    schema: forgotPasswordSchema,
    defaultValues: { email: '' },
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

  if (form.formState.isSubmitSuccessful) {
    return (
      <AuthCard
        icon={MailQuestion}
        title="Check your inbox"
        description="If an account matches that address, a reset link is on its way."
        footer={backToSignIn}
      >
        <div className="flex flex-col gap-3">
          <FormMessage tone="success">
            The link expires shortly — request another if it lapses.
          </FormMessage>

          <Button variant="outline" onClick={() => form.reset()} className="w-full">
            Use a different address
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      icon={MailQuestion}
      title="Forgot password"
      description="We will email you a link to choose a new password."
      footer={backToSignIn}
    >
      <Form
        form={form}
        // Always resolves 200 with identical copy whether or not the address is
        // registered — the success screen above must not imply otherwise.
        onSubmit={(values) => authService.forgotPassword(values.email)}
        mapError={resolveAuthError}
      >
        <TextField<ForgotPasswordValues>
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          autoFocus
        />

        <FormActions submitLabel="Send reset link" submittingLabel="Sending…" fullWidth />
      </Form>
    </AuthCard>
  )
}

export default ForgotPasswordPage
