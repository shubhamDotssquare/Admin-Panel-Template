import { Menu, Search } from 'lucide-react'

import { AppBreadcrumbs } from '@/components/layout/app-breadcrumbs'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu, type UserMenuUser } from '@/components/layout/user-menu'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useLayout } from '@/hooks/use-layout'
import { cn } from '@/utils/cn'

interface AppHeaderProps {
  user?: UserMenuUser
  onSignOut?: () => void
  /** Extra controls injected between the trail and the utility cluster. */
  actions?: React.ReactNode
}

/**
 * Sticky top bar: nav trigger, breadcrumb trail, and the utility cluster
 * (search, theme, account).
 */
export function AppHeader({ user, onSignOut, actions }: AppHeaderProps) {
  const { toggleSidebar, isMobile } = useLayout()

  return (
    <header
      className={cn(
        'border-border bg-background/85 supports-[backdrop-filter]:bg-background/70',
        'sticky top-0 z-20 flex h-header shrink-0 items-center gap-2',
        'border-b px-4 backdrop-blur-sm',
      )}
    >
      {isMobile && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>
          <Separator orientation="vertical" className="mr-1 !h-5" />
        </>
      )}

      <AppBreadcrumbs />

      <div className="ml-auto flex items-center gap-1">
        {actions}

        {/* Placeholder trigger — the command palette lands with its module. */}
        <Button variant="ghost" size="icon" aria-label="Search" disabled>
          <Search className="size-4" />
        </Button>

        <ThemeToggle />

        <Separator orientation="vertical" className="mx-1 !h-5" />

        <UserMenu user={user} onSignOut={onSignOut} />
      </div>
    </header>
  )
}
