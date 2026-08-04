import { KeyRound } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDocumentTitle } from '@/hooks/use-document-title'

/**
 * Stand-in for the sign-in screen so `AuthLayout` has something to render.
 *
 * The real authentication screens belong to the Admin Manager module; replace
 * this route once that module lands.
 */
export function AuthPlaceholderPage() {
  useDocumentTitle('Sign in')

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
          <KeyRound className="size-5" />
        </div>
        <CardTitle className="text-heading-3">Sign in</CardTitle>
        <CardDescription>
          Authentication is not wired up yet. This route reserves the auth layout.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-caption text-muted-foreground">
          Implement the sign-in form in the Admin Manager module and point{' '}
          <code className="font-mono">PATHS.auth.login</code> at it. Set{' '}
          <code className="font-mono">VITE_AUTH_ENABLED=true</code> to activate the route
          guards.
        </p>
      </CardContent>
    </Card>
  )
}

export default AuthPlaceholderPage
