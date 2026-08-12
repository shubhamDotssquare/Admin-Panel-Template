import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { TOAST_DURATION_MS } from '@/constants/ui'
import { AuthProvider } from './auth-provider'
import { BreadcrumbProvider } from './breadcrumb-provider'
import { ConfirmProvider } from './confirm-provider'
import { LayoutProvider } from './layout-provider'
import { QueryProvider } from './query-provider'
import { ThemeProvider } from './theme-provider'

/**
 * Every cross-cutting provider, composed once.
 *
 * Add new global concerns (data fetching, i18n) here so `main.tsx` and the
 * router stay untouched. `AuthProvider` sits above the router because the route
 * guards read from it.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <AuthProvider>
          <QueryProvider>
            <LayoutProvider>
              <BreadcrumbProvider>
                <ConfirmProvider>
                  {children}
                  <Toaster
                    duration={TOAST_DURATION_MS}
                    position="top-right"
                    richColors
                    closeButton
                  />
                </ConfirmProvider>
              </BreadcrumbProvider>
            </LayoutProvider>
          </QueryProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export { AuthContext, AuthProvider, type AuthContextValue } from './auth-provider'
export {
  BreadcrumbContext,
  BreadcrumbProvider,
  type BreadcrumbContextValue,
} from './breadcrumb-provider'
export { ConfirmContext, ConfirmProvider, type ConfirmContextValue } from './confirm-provider'
export { LayoutContext, LayoutProvider, type LayoutContextValue } from './layout-provider'
export { QueryProvider } from './query-provider'
export { ThemeContext, ThemeProvider } from './theme-provider'
