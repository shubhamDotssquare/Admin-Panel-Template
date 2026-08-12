import { useEffect, useRef, useState } from 'react'
import { CircleCheck, MailWarning } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { AuthCard } from '@/components/common/auth-card'
import { FormMessage } from '@/components/common/form-message'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { appConfig } from '@/config/app.config'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { PATHS } from '@/router/paths'
import { authService } from '@/services/auth.service'
import { resolveAuthError } from '@/services/auth-error'

type VerifyState =
  | { phase: 'verifying' }
  | { phase: 'verified'; email?: string }
  | { phase: 'failed'; message: string; canRequestNewLink: boolean }
  | { phase: 'missing-token' }

/**
 * Lands from the emailed confirmation link and exchanges its token.
 *
 * Verification runs on mount rather than behind a button: the user already
 * expressed intent by following the link, so asking them to click again would be
 * a step for nothing.
 */
export function VerifyEmailPage() {
  useDocumentTitle('Verify email')

  const [searchParams] = useSearchParams()
  const token = searchParams.get(appConfig.auth.resetTokenParam)

  const [state, setState] = useState<VerifyState>(() =>
    token ? { phase: 'verifying' } : { phase: 'missing-token' },
  )

  // The token is single-use, so a duplicate call would fail with TOKEN_USED and
  // wrongly show an error. StrictMode double-invokes effects in development,
  // which makes that guard necessary rather than defensive.
  const attempted = useRef(false)

  useEffect(() => {
    if (!token || attempted.current) return
    attempted.current = true

    let cancelled = false

    void authService
      .verifyEmail(token)
      .then((result) => {
        if (!cancelled) setState({ phase: 'verified', email: result?.user?.email })
      })
      .catch((error: unknown) => {
        if (cancelled) return

        const resolved = resolveAuthError(error)
        setState({
          phase: 'failed',
          message: resolved.message,
          canRequestNewLink: resolved.action === 'requestNewLink',
        })
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const signInLink = (
    <Link to={PATHS.auth.login} className="text-primary hover:underline">
      Go to sign in
    </Link>
  )

  if (state.phase === 'verifying') {
    return (
      <AuthCard title="Confirming your email" description="This will only take a moment.">
        <div className="flex justify-center py-4">
          <Spinner size="lg" label="Confirming your email…" />
        </div>
      </AuthCard>
    )
  }

  if (state.phase === 'verified') {
    return (
      <AuthCard
        icon={CircleCheck}
        title="Email confirmed"
        description={
          state.email
            ? `${state.email} is confirmed. You can sign in now.`
            : 'Your address is confirmed. You can sign in now.'
        }
      >
        <Button asChild className="w-full">
          <Link to={PATHS.auth.login}>Continue to sign in</Link>
        </Button>
      </AuthCard>
    )
  }

  if (state.phase === 'missing-token') {
    return (
      <AuthCard
        icon={MailWarning}
        title="Link is not valid"
        description="This confirmation link is incomplete."
        footer={signInLink}
      >
        <FormMessage>
          Open the link directly from the email — copying it by hand can drop part of the token.
        </FormMessage>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      icon={MailWarning}
      title="Could not confirm your email"
      description={state.message}
      footer={signInLink}
    >
      {state.canRequestNewLink && (
        // Resending is driven from the sign-in screen, which already has the
        // address to hand — no need to ask for it twice.
        <Button asChild variant="outline" className="w-full">
          <Link to={PATHS.auth.login}>Sign in to request a new link</Link>
        </Button>
      )}
    </AuthCard>
  )
}

export default VerifyEmailPage
