import { ArrowLeft, MailCheck, UserPlus } from 'lucide-react'
import { Link } from 'react-router'
import { z } from 'zod'

import { AuthCard } from '@/components/common/auth-card'
import { FormMessage } from '@/components/common/form-message'
import { FieldGroup, Form, FormActions, TextField, useAppForm } from '@/components/form'
import { appConfig } from '@/config/app.config'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { emailSchema, passwordSchema, withMatchingFields } from '@/lib/zod-schemas'
import { PATHS } from '@/router/paths'
import { authService } from '@/services/auth.service'
import { resolveAuthError } from '@/services/auth-error'

const registerSchema = withMatchingFields(
  z.object({
    firstName: z.string().trim().max(80, 'Must be 80 characters or fewer.'),
    lastName: z.string().trim().max(80, 'Must be 80 characters or fewer.'),
    email: emailSchema,
    password: passwordSchema(),
    confirmPassword: z.string().min(1, 'Re-enter the password.'),
  }),
  'password',
  'confirmPassword',
)

type RegisterValues = z.infer<typeof registerSchema>

/**
 * Create an account.
 *
 * Registering does **not** sign anyone in: the account is created `PENDING` and
 * stays unusable until the emailed link is followed, so the success state points
 * at the inbox rather than the dashboard.
 *
 * `EMAIL_ALREADY_REGISTERED` needs no handling here — the resolver maps that code
 * onto the email field automatically.
 */
export function RegisterPage() {
  useDocumentTitle('Create account')

  const { passwordMinLength, passwordMaxLength } = appConfig.auth

  const form = useAppForm<RegisterValues>({
    schema: registerSchema,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
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
        icon={MailCheck}
        title="Confirm your email"
        description={`We sent a confirmation link to ${form.getValues('email')}. Follow it to activate your account.`}
        footer={backToSignIn}
      >
        <FormMessage tone="info">
          You will not be able to sign in until the address is confirmed.
        </FormMessage>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      icon={UserPlus}
      title="Create account"
      description={`Set up your access to ${appConfig.name}.`}
      footer={backToSignIn}
    >
      <Form
        form={form}
        onSubmit={(values) =>
          authService.register({
            email: values.email,
            password: values.password,
            // Optional on the API; omit rather than send empty strings.
            firstName: values.firstName || undefined,
            lastName: values.lastName || undefined,
          })
        }
        mapError={resolveAuthError}
      >
        <FieldGroup>
          <TextField<RegisterValues>
            name="firstName"
            label="First name"
            autoComplete="given-name"
            placeholder="Ada"
            autoFocus
          />
          <TextField<RegisterValues>
            name="lastName"
            label="Last name"
            autoComplete="family-name"
            placeholder="Lovelace"
          />
        </FieldGroup>

        <TextField<RegisterValues>
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
        />

        <TextField<RegisterValues>
          name="password"
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          hint={`${passwordMinLength}–${passwordMaxLength} characters, with upper and lower case, a number and a symbol.`}
        />

        <TextField<RegisterValues>
          name="confirmPassword"
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
        />

        <FormActions
          submitLabel="Create account"
          submittingLabel="Creating account…"
          fullWidth
        />
      </Form>
    </AuthCard>
  )
}

export default RegisterPage
