import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { TOAST_DURATION_MS } from '@/constants/ui'
import { LayoutProvider } from './layout-provider'
import { ThemeProvider } from './theme-provider'

/**
 * Every cross-cutting provider, composed once.
 *
 * Add new global concerns (data fetching, i18n, auth) here so `main.tsx` and
 * the router stay untouched.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <LayoutProvider>
          {children}
          <Toaster duration={TOAST_DURATION_MS} position="top-right" richColors closeButton />
        </LayoutProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export { LayoutContext, LayoutProvider, type LayoutContextValue } from './layout-provider'
export { ThemeContext, ThemeProvider } from './theme-provider'
