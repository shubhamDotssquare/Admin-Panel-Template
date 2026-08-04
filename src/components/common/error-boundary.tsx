import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { env } from '@/config/env'
import { toErrorMessage } from '@/services/api-error'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Replaces the default panel; receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /** Hook for a logging/monitoring service. */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render-time crashes so one broken module cannot take down the shell.
 *
 * Wrap each module's outlet (already done in `AdminLayout`) to keep failures
 * scoped to the page the user is on.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info)

    if (env.isDev) {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.fallback) return this.props.fallback(error, this.reset)

    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
      >
        <div className="grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-5" />
        </div>

        <div className="space-y-1">
          <h3 className="text-heading-4">Something went wrong</h3>
          <p className="mx-auto max-w-md text-body text-muted-foreground">
            {env.isDev
              ? toErrorMessage(error)
              : 'This screen failed to load. Please try again.'}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={this.reset}>
          <RotateCcw className="size-4" />
          Try again
        </Button>
      </div>
    )
  }
}
